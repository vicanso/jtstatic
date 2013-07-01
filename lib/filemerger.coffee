###*!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
###

_ = require 'underscore'
path = require 'path'
fs = require 'fs'
mkdirp = require 'mkdirp'
config = require './config'
async = require 'async'
parser = require './parser'
crypto = require 'crypto'
stylus = require 'stylus'
uglifyJS = require 'uglify-js'

fileMerger =
  ###*
   * getDefineMergeList 获取已定义合并的文件（如果不是已定义合并的文件，返回null）
   * @param  {[type]} file [description]
   * @return {[type]}      [description]
  ###
  getDefineMergeList : (file) ->
    mergeList = config.mergeList
    result = null
    if mergeList
      result = _.find mergeList, (item) ->
        ~_.indexOf item, file
    result
  ###*
   * urlHandle css中的URL处理
   * @param  {[type]} data     [description]
   * @param  {[type]} file     [description]
   * @param  {[type]} saveFile [description]
   * @param  {[type]} cbf      [description]
   * @return {[type]}          [description]
  ###
  urlHandle : (data, file, saveFile, cbf) ->
    imagesPath = path.relative path.dirname(saveFile), path.dirname(file)
    reg = /url\(\"?\'?([\S]*?)\'?\"?\)/g
    urlList = data.match reg
    reg = /url\(\"?\'?([\S]*?)\'?\"?\)/
    imageInlineHandle = @imageInlineHandle {
      path : path.dirname file
    }
    if !urlList || !urlList.length
      cbf null, data
    else
      async.eachLimit urlList, 10, (url, cbf) ->
        result = reg.exec url
        if result && result[1]
          result = result[1]
          if result.indexOf 'data:'
            imageInlineHandle result, (err, dataUri) ->
              if dataUri
                resultUrl = dataUri
              else
                resultUrl = path.join(imagesPath, result).replace /\\/g, '\/'
              resultUrl = url.replace result, resultUrl
              if url != resultUrl
                data = data.replace url, resultUrl
              cbf null
      , ->
        cbf null, data
  ###*
   * imageInlineHandle 内联图片处理
   * @param  {[type]} options {path : xxx, limit : xxx}
   * @return {[type]}         [description]
  ###
  imageInlineHandle : (options) ->
    filePath = options.path
    limit = options.limit || 10 * 1024
    mimes =
      '.gif' : 'image/gif'
      '.png' : 'image/png'
      '.jpg' : 'image/jpeg'
      '.jpeg' : 'image/jpeg'
      '.svg' : 'image/svg+xml'
    (file, cbf) ->
      ext = path.extname file
      mime = mimes[ext]
      if !config.inlineImage || !file.indexOf 'http' || !mime
        cbf null, ''
        return
      file = path.join filePath, file
      async.waterfall [
        (cbf) ->
          fs.exists file, (exists) ->
            if exists
              fs.readFile file, cbf
            else
              cbf null, ''
        (data, cbf) ->
          if !data || data.length > limit
            cbf null, ''
          else
            cbf null, "data:#{mime};base64,#{data.toString('base64')}"
      ], cbf
  ###*
   * mergeFiles 合并文件
   * @param  {Array} files 需要合并的文件列表
   * @param  {String} saveFile 保存的文件
   * @param  {Function} cbf 完成时的call back
   * @return {jtUtil}             [description]
  ###
  mergeFiles : (files, saveFile, cbf = noop) ->
    results = []
    fileHandleList = _.map files, (file) =>
      (cbf) =>
        ext = path.extname file
        async.waterfall [
          (cbf) ->
            fs.readFile file, 'utf8', cbf
          (data, cbf) ->
            if ~_.indexOf parser.getParseExts(), ext
              parser.parse file, data, (err, data) ->
                if err
                  cbf err
                else
                  cbf null, "/*#{file}*/#{data}"
            else if jsIsNotMin file
              cbf null, "/*#{file}*/#{uglifyJS.minify(data, {fromString : true}).code}"
            else
              cbf null, "/*#{file}*/#{data}"
          (data, cbf) =>
            # if config.isProductionMode
            #   data = data.replace /\n/g, ''
            if ext == '.less' || ext == '.css' || ext == '.styl'
              @urlHandle data, file, saveFile, cbf
            else
              cbf null, data
        ], cbf
    async.series fileHandleList, (err, results) ->
      if err
        cbf err
      else
        async.series [
          (cbf) ->
            mkdirp path.dirname(saveFile), cbf
          (cbf) ->
            fs.writeFile saveFile, _.compact(results).join('\n'), cbf
        ], cbf
    @

  ###*
   * mergeFilesToTemp 将文件合并到临时文件夹，合并的文件根据所有文件的文件名通过sha1生成，返回该文件名
   * @param  {Array} mergeFiles 合并文件列表
   * @param  {String} type 文件类型（用于作为文件后缀）
   * @return {String}            合并后的文件名
  ###
  mergeFilesToTemp : (mergeFiles, type) ->
    _.each mergeFiles, (file, i) ->
      mergeFiles[i] = path.join config.path, file
    getFileHash = (arr) ->
      hashList = _.map arr, (file) ->
        path.basename file
      hashList.push crypto.createHash('sha1').update(arr.join('')).digest 'hex'
      hashList.join '_'

    linkFileHash = getFileHash mergeFiles
    linkFileName = "#{linkFileHash}.#{type}" 

    saveFile = path.join config.mergePath, linkFileName
    fs.exists saveFile, (exists) =>
      if !exists
        @mergeFiles mergeFiles, saveFile, (err) ->
          if err
            console.error err
    linkFileName

jsIsNotMin = (file) ->
  jsExt = '.js'
  jsMinExt = '.min.js'
  if jsExt == file.substring(file.length - jsExt.length) && jsMinExt != file.substring file.length - jsMinExt.length
    true
  else
    false
module.exports = fileMerger

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


fileMerger = 
  getDefineMergeList : (file) ->
    mergeList = config.mergeList
    result = null
    if mergeList
      result = _.find mergeList, (item) ->
        ~_.indexOf item, file
    result
  ###*
   * mergeFiles 合并文件
   * @param  {Array} files 需要合并的文件列表
   * @param  {String} saveFile 保存的文件
   * @param  {Function} dataConvert 可选参数，需要对数据做的转化，如果不需要转换，该参数作为完成时的call back
   * @param  {Function} cbf 完成时的call back
   * @return {jtUtil}             [description]
  ###
  mergeFiles : (files, saveFile, dataConvert, cbf = noop) ->
    self = @
    funcs = []
    if arguments.length == 3
      cbf = dataConvert
      dataConvert = null
    _.each files, (file) ->
      funcs.push (cbf) ->
        handle = (err, data) ->
          if !err && dataConvert
            data = dataConvert data, file, saveFile
          cbf err, data
        ext = path.extname file
        if ~_.indexOf parser.getParseExts(), ext
          handle = _.wrap handle, (func, err, data) ->
            if err
              func err, data
            else
              parser.parse file, data, func
        fs.readFile file, 'utf8', handle
          
    async.parallel funcs, (err, results) ->
      if err
        cbf err
      else
        mkdirp path.dirname(saveFile), (err) ->
          if err 
            cbf err
          else
            fs.writeFile saveFile, results.join(''), cbf
    return @

  ###*
   * mergeFilesToTemp 将文件合并到临时文件夹，合并的文件根据所有文件的文件名通过sha1生成，返回该文件名
   * @param  {Array} mergeFiles 合并文件列表
   * @param  {String} type 文件类型（用于作为文件后缀）
   * @return {String}            合并后的文件名
  ###
  mergeFilesToTemp : (mergeFiles, type) ->
    #已提前作合并的文件不再作合并
    # mergeFiles = _.filter mergeFiles, (file) ->
    #   return fileMerger.getMergeFile(file, type) == ''
    _.each mergeFiles, (file, i) ->
      mergeFiles[i] = path.join config.path, file
    getFileHash = (arr) ->
      hashList = _.map arr, (file) ->
        path.basename file
      hashList.join '_'
    linkFileHash = getFileHash mergeFiles
    linkFileName = "#{linkFileHash}.#{type}" 

    saveFile = path.join config.mergePath, linkFileName
    fs.exists saveFile, (exists) =>
      if !exists
        @mergeFiles mergeFiles, saveFile, (data, file, saveFile) =>
          ext = path.extname file
          if ext == '.less' || ext == '.css' || ext == '.styl'
            data = @_convertUrl data, file, saveFile
          else if ext == '.coffee' || ext == '.js'
            data += ';'
          return "/*#{path.basename(file)}*/#{data}\n"
        ,(err) ->
          if err
            console.error err
    return linkFileName
  _convertUrl : (data, file, saveFile) ->
    imagesPath = path.relative path.dirname(saveFile), path.dirname(file)
    reg = /url\(\"?\'?([\S]*?)\'?\"?\)/g
    urlList = data.match reg
    reg = /url\(\"?\'?([\S]*?)\'?\"?\)/
    _.each urlList, (url) ->
      result = reg.exec url
      if result && result[1]
        result = result[1]
        if result.indexOf 'data:'
          resultUrl = path.join(imagesPath, result).replace /\\/g, '\/'
          resultUrl = url.replace result, resultUrl
          if url != resultUrl
            data = data.replace url, resultUrl
    data.replace /\n/g, ''
module.exports = fileMerger

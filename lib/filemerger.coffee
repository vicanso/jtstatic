###*!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
###

_ = require 'underscore'
path = require 'path'
fs = require 'fs'
mkdirp = require 'mkdirp'
async = require 'async'
parser = require './parser'
crypto = require 'crypto'
inlineImage = require './inlineimage'
fileMerger =
  convertPath : (data, file, saveFile, cbf) ->
    currentFilePath = path.dirname file
    saveFilePath = path.dirname saveFile
    reg = /url\(([\s\S]*?)\)/g
    cssData = []
    result = null
    startIndex = 0
    console.dir file
    async.whilst ->
      (result = reg.exec(data)) != null
    , (cbf) ->
      css = result[0]
      cssData.push data.substring startIndex, result.index
      startIndex = result.index
      if !~css.indexOf 'base64,'
        imgUrl = result[1]
        firstChar = imgUrl.charAt 0
        if firstChar == '"' || firstChar == "'"
          imgUrl = imgUrl.substring 1, imgUrl.length - 1
        imgFile = path.join currentFilePath, imgUrl
        imgUrl = path.relative saveFilePath, imgFile
        cssData.push 'url("' + imgUrl + '")'
        startIndex += css.length
      cbf null
    , (err) ->
      cssData.push data.substring startIndex
      cbf err, cssData.join ''
  ###*
   * getDefineMergeList 获取已定义合并的文件（如果不是已定义合并的文件，返回null）
   * @param  {[type]} file [description]
   * @return {[type]}      [description]
  ###
  getDefineMergeList : (file, mergeList) ->
    result = null
    if mergeList
      result = _.find mergeList, (item) ->
        ~_.indexOf item, file
    _.clone result
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
            else
              cbf null, "/*#{file}*/#{data}"
          (data, cbf) =>
            if ext == '.css'
              @convertPath data, file, saveFile, cbf
              # inlineImage.url data, file, saveFile, limitSize, cbf
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
   * mergeFilesToTemp 将文件合并到临时文件夹，合并的文件根据所有文件的文件名生成，如果文件名过长，使用sha1生成 的字符串，返回该文件名
   * @param  {Array} mergeFiles 合并文件列表
   * @param  {String} type 文件类型（用于作为文件后缀）
   * @param  {String} staticPath 静态文件目录
   * @param  {String} mergePath 合并文件目录
   * @return {String}            合并后的文件名
  ###
  mergeFilesToTemp : (mergeFiles, type, staticPath, mergePath) ->
    _.each mergeFiles, (file, i) ->
      mergeFiles[i] = path.join staticPath, file
    getFileHash = (arr) ->
      hashList = _.map arr, (file) ->
        path.basename file
      name = hashList.join '-'
      if name.length < 0x7f
        name
      else
        crypto.createHash('sha1').update(arr.join('')).digest 'hex'

    linkFileHash = getFileHash mergeFiles
    linkFileName = "#{linkFileHash}.#{type}" 

    saveFile = path.join mergePath, linkFileName
    fs.exists saveFile, (exists) =>
      if !exists
        @mergeFiles mergeFiles, saveFile, (err) ->
          if err
            console.error err
    linkFileName

module.exports = fileMerger

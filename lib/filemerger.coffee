###*!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
###

_ = require 'underscore'
path = require 'path'
fs = require 'fs'
mkdirp = require 'mkdirp'
config = require './config'
crypto = require 'crypto'
async = require 'async'
parser = require './parser'

tempFilesStatus = {}

fileMerger = 
  ###*
   * getMergeFile 根据当前文件返回合并对应的文件名，若该文件未被合并，则返回空字符串
   * @param  {String} file 当前文件
   * @param  {String} type 文件类型（css, js）
   * @return {String} 返回合并后的文件名
  ###
  getMergeFile : (file, type) ->
    self = @
    mergeFile = ''
    if type is 'css'
      searchFiles = self.cssList
    else
      searchFiles = self.jsList
    _.each searchFiles, (searchInfo) ->
      files = searchInfo.files
      if !mergeFile && (_.indexOf files, file, true) != -1
        mergeFile = searchInfo.name
    return mergeFile
  ###*
   * isMergeByOthers 该文件是否是由其它文件合并而来
   * @param  {String}  file 文件名
   * @return {Boolean}      [description]
  ###
  isMergeByOthers : (file) ->
    self = @
    files = _.pluck(self.cssList, 'name').concat _.pluck self.jsList, 'name'
    return _.indexOf(files, file) != -1
  ###*
   * mergeFilesBeforeRunning 合并文件(在程序运行之前，主要是把一些公共的文件合并成一个，减少HTTP请求)
   * @param  {Boolean} merging 是否真实作读取文件合并的操作（由于有可能有多个worker进程，因此只需要主进程作真正的读取，合并操作，其它的只需要整理合并列表）
   * @param {Array} mergeFiles 合并文件列表
   * @return {[type]}              [description]
  ###
  mergeFilesBeforeRunning : (merging, mergeFiles) ->
    self = @
    _.each mergeFiles, (mergerInfo, mergerType) ->
      if _.isArray mergerInfo
        mergeList = []
        _.each mergerInfo, (mergers) ->
          mergeList.push mergers
        if merging
          _.each mergeList, (mergers) ->
            saveFile = path.join config.path, mergers.name
            content = []
            _.each mergers.files, (file, i) ->
              content .push fs.readFileSync path.join(config.path, file), 'utf8'
            mkdirp path.dirname(saveFile), (err) ->
              if err
                console.error err
              fileSplit = ''
              if mergerType == 'js'
                fileSplit = ';'
              fs.writeFileSync saveFile, content.join fileSplit
            mergers.files.sort()
        self["#{mergerType}List"] = mergeList
    return self
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
        switch ext
          when '.less' 
          then handle = _.wrap handle, (func, err, data) ->
              if err
                func err, data
              else
                options = 
                  paths : [path.dirname file]
                  compress : true
                parser.parseLess data, options, func
          when '.styl'
          then handle = _.wrap handle, (func, err, data) ->
              if err
                func err, data
              else
                options = 
                  paths : [path.dirname file]
                  filename : file
                  compress : true
                parser.parseStylus data, options, func
          when '.coffee'
          then handle = _.wrap handle, (func, err, data) ->
              if err
                func err, data
              else
                options = 
                  fromString : true
                  warnings : true
                parser.parseCoffee data, options, func
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
    self = @
    #已提前作合并的文件不再作合并
    mergeFiles = _.filter mergeFiles, (file) ->
      return fileMerger.getMergeFile(file, type) == ''
    getFileHash = (arr) ->
      hashList = _.map arr, (file) ->
        path.basename file
      hashList.join '_'
    linkFileHash = getFileHash mergeFiles
    linkFileName = "#{linkFileHash}.#{type}" 

    saveFile = path.join config.mergePath, linkFileName
    # 判断该文件是否已成生成好，若生成好，HTML直接加载该文件
    if tempFilesStatus[linkFileHash] == 'complete' || fs.existsSync saveFile
      tempFilesStatus[linkFileHash] = 'complete'
    else
      # 判断是否该文件正在合并中，若正在合并，则直接返回空字符串。若不是，则调用合并，并在状态记录中标记为merging
      if !tempFilesStatus[linkFileHash]
        tempFilesStatus[linkFileHash] = 'merging'
        self.mergeFiles mergeFiles, saveFile, (data, file, saveFile) ->
          ext = path.extname file
          if ext == '.less' || ext == '.css' || ext == '.styl'
            imagesPath = path.relative path.dirname(saveFile), path.dirname(file)
            imagesPath = path.join imagesPath, '../images'
            data = data.replace(/\s/g, '').replace /..\/images/g, imagesPath.replace /\\/g, '\/'
          else if ext == '.coffee' || ext == '.js'
            data += ';'
          return "/*#{path.basename(file)}*/#{data}\n"
        ,(err) ->
          if err
            delete tempFilesStatus[linkFileHash]
            console.error err
          else
            tempFilesStatus[linkFileHash] = 'complete'
            # fileMergerEvent.emit 'complete', linkFileHash

    return linkFileName

module.exports = fileMerger

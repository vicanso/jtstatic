###*!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
###

_ = require 'underscore'
path = require 'path'
fs = require 'fs'

config = require './config'
fileMerger = require './filemerger'

class FileImporter
  ###*
   * constructor 文件引入类
   * @param  {Boolean} debug 是否debug模式，debug模式下将.min.js替换为.js
   * @param  {String} host 静态文件的host
   * @return {FileImporter}       [description]
  ###
  constructor : (debug, @host) ->
    @cssFiles = []
    @jsFiles = []
    @debug = debug || false
  ###*
   * importCss 引入css文件
   * @param  {String} path     css路径
   * @param  {Boolean} {optioanl} prepend 是否插入到数组最前（在HTML中首先输出）
   * @return {FileImporter}         [description]
  ###
  importCss : (path, prepend) ->
    self = @
    self.importFiles path, 'css', prepend
    return self
  ###*
   * importJs 引入js文件
   * @param  {String} path    js路径
   * @param  {Boolean} {optioanl} prepend [是否插入到数组最前（在HTML中首先输出）]
   * @return {FileImporter}         [description]
  ###
  importJs : (path, prepend) ->
    self = @
    self.importFiles path, 'js', prepend
    return self
  ###*
   * importFiles 引入文件
   * @param  {String} path    文件路径
   * @param  {String} type    文件类型(css, js)
   * @param  {Boolean} {optioanl} prepend 是否插入到数组最前（在HTML中首先输出）
   * @return {FileImporter}         [description]
  ###
  importFiles : (path, type, prepend) ->
    self = @
    if _.isString path
      path = path.trim()
      if path.charAt(0) != '/'
        path = '/' + path
      if type == 'css'
        if !~_.indexOf self.cssFiles, path
          if prepend
            self.cssFiles.unshift path
          else
            self.cssFiles.push path
      else if !~_.indexOf self.jsFiles, path
        if prepend
          self.jsFiles.unshift path
        else
          self.jsFiles.push path
    else if _.isArray path
      if prepend
        path.reverse()
      _.each path, (item) ->
        self.importFiles item, type, prepend

    return self
  ###*
   * exportCss 输出CSS标签
   * @param  {Boolean} merge 是否合并css文件
   * @return {String} 返回css标签
  ###
  exportCss : (merge) ->
    self = @
    return @_getExportFilesHTML self.cssFiles, 'css', self.debug, merge, @host
  ###*
   * exportJs 输出JS标签
   * @param  {Boolean} merge 是否合并js文件
   * @return {String} 返回js标签
  ###
  exportJs : (merge) ->
    self = @
    return @_getExportFilesHTML self.jsFiles, 'js', self.debug, merge, @host

  ###*
   * _getExportFilesHTML 获取引入文件列表对应的HTML
   * @param  {Array} files 引入文件列表
   * @param  {String} type  引入文件类型，现支持css, js
   * @param  {Boolean} debug 是否debug模式
   * @param  {Boolean} merge 是否需要合并文件
   * @param  {String} host 静态文件的host
   * @return {String} 返回html标签内容
  ###
  _getExportFilesHTML : (files, type, debug, merge, host) ->
    self = @
    resultFiles = []
    _.each files, (file) ->
      if !self._isFilter file
        if debug && type == 'js'
          file = file.replace '.min.js', '.js'
        defineMergeList = fileMerger.getDefineMergeList file
        if defineMergeList
          resultFiles.push defineMergeList
        else
          resultFiles.push file
      else
        resultFiles.push file
    resultFiles = _.compact resultFiles
    otherFiles = []

    mergeFile = (files) ->
      linkFileName = fileMerger.mergeFilesToTemp files, type
      mergeUrlPrefix = config.mergeUrlPrefix
      if mergeUrlPrefix
        linkFileName = "#{mergeUrlPrefix}/#{linkFileName}"
      self._getExportHTML linkFileName, type, host
    htmlArr = _.map resultFiles, (result) ->
      if _.isArray result
        mergeFile result
      else if merge
        otherFiles.push result
        ''
      else
        self._getExportHTML result, type, host
    if otherFiles.length
      htmlArr.push mergeFile otherFiles
    htmlArr.join ''

  ###*
   * _isFilter 判断该文件是否应该过滤的
   * @param  {String}  file 引入文件路径
   * @return {Boolean}      [description]
  ###
  _isFilter : (file) ->
    filterPrefix = 'http'
    if file.substring(0, filterPrefix.length) == filterPrefix
      return true
    else
      return false

  ###*
   * _getExportHTML 返回生成的HTML
   * @param  {String} file   引入的文件
   * @param  {String} type   文件类型
   * @param  {String} host 静态文件的host
   * @return {String} 返回相应的html
  ###
  _getExportHTML : (file, type, host) ->
    html = ''
    switch type
      when 'js' then html = @_exportJsHTML file, host
      else html = @_exportCssHTML file, host
    return html

  ###*
   * _exportJsHTML 返回引入JS的标签HTML
   * @param  {String} file   引入的文件
   * @return {String} 返回相应的html
  ###
  _exportJsHTML : (file, host) ->
    url = @_getUrl file, host
    return '<script type="text/javascript" src="' + url + '"></script>'

  ###*
   * _exportCssHTML 返回引入CSS标签的HTML
   * @param  {String} file   引入的文件
   * @return {String} 返回相应的html
  ###
  _exportCssHTML : (file, host) ->
    url = @_getUrl file, host
    return '<link rel="stylesheet" href="' + url + '" type="text/css" />'
  ###*
   * _getUrl 获取引用文件的URL
   * @param  {String} file 文件路径
   * @param  {String, Array} host 文件域名
   * @return {[type]}      [description]
  ###
  _getUrl : (file, host) ->
    version = config.version
    urlPrefix = config.urlPrefix
    if urlPrefix.charAt(0) != '/'
      urlPrefix = '/' + urlPrefix
    if file.indexOf('http://') != 0
      if version
        file += "?version=#{version}"
      if file.charAt(0) != '/'
        file = '/' + file
      if urlPrefix
        file = "#{urlPrefix}#{file}"
      if host
        if _.isArray host
          index = Math.floor Math.random() * host.length
          file = host[index] + file
        else
          file = host + file
    file


module.exports = FileImporter

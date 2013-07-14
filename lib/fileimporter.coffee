###*!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
###

_ = require 'underscore'
fs = require 'fs'

config = require './config'
fileMerger = require './filemerger'

class FileImporter
  ###*
   * constructor 文件引入类
   * @param  {String} hosts 静态文件的hosts
   * @return {FileImporter}       [description]
  ###
  constructor : (@host) ->
    @cssFiles = []
    @jsFiles = []
    if !@hosts
      @hosts = config.hosts
    if @hosts && !_.isArray @hosts
      @hosts = [@hosts]
  ###*
   * importCss 引入css文件
   * @param  {String} file     css路径
   * @param  {Boolean} {optioanl} prepend 是否插入到数组最前（在HTML中首先输出）
   * @return {FileImporter}         [description]
  ###
  importCss : (file, prepend) ->
    @importFiles file, 'css', prepend
    @
  ###*
   * importJs 引入js文件
   * @param  {String} file    js路径
   * @param  {Boolean} {optioanl} prepend [是否插入到数组最前（在HTML中首先输出）]
   * @return {FileImporter}         [description]
  ###
  importJs : (file, prepend) ->
    @importFiles file, 'js', prepend
    @
  ###*
   * importFiles 引入文件
   * @param  {String} file    文件路径
   * @param  {String} type    文件类型(css, js)
   * @param  {Boolean} {optioanl} prepend 是否插入到数组最前（在HTML中首先输出）
   * @return {FileImporter}         [description]
  ###
  importFiles : (file, type, prepend) ->
    cssFiles = @cssFiles
    jsFiles = @jsFiles
    if _.isString file
      file = file.trim()
      if file.charAt(0) != '/' && !@_isFilter file
        file = '/' + file
      if type == 'css'
        if !~_.indexOf cssFiles, file
          if prepend
            cssFiles.unshift file
          else
            cssFiles.push file
      else if !~_.indexOf jsFiles, file
        if prepend
          jsFiles.unshift file
        else
          jsFiles.push file
    else if _.isArray file
      if prepend
        file.reverse()
      _.each file, (item) =>
        @importFiles item, type, prepend
    @
  ###*
   * exportCss 输出CSS标签
   * @param  {Boolean} merge 是否合并css文件
   * @return {String} 返回css标签
  ###
  exportCss : (merge) ->
    @_getExportFilesHTML @cssFiles, 'css', merge
  ###*
   * exportJs 输出JS标签
   * @param  {Boolean} merge 是否合并js文件
   * @return {String} 返回js标签
  ###
  exportJs : (merge) ->
    @_getExportFilesHTML @jsFiles, 'js', merge

  ###*
   * _getExportFilesHTML 获取引入文件列表对应的HTML
   * @param  {Array} files 引入文件列表
   * @param  {String} type  引入文件类型，现支持css, js
   * @param  {Boolean} merge 是否需要合并文件
   * @return {String} 返回html标签内容
  ###
  _getExportFilesHTML : (files, type, merge) ->
    hosts = @hosts
    resultFiles = []
    _.each files, (file) =>
      if !@_isFilter file
        file = @_convertExt file
        # if debug && type == 'js'
        #   file = file.replace '.min.js', '.js'
        defineMergeList = fileMerger.getDefineMergeList file
        if defineMergeList && config.isProductionMode
          resultFiles.push defineMergeList
        else
          resultFiles.push file
      else
        resultFiles.push file
    resultFiles = _.uniq _.compact resultFiles
    otherFiles = []

    mergeFile = (files) =>
      linkFileName = fileMerger.mergeFilesToTemp files, type
      mergeUrlPrefix = config.mergeUrlPrefix
      if mergeUrlPrefix
        linkFileName = "#{mergeUrlPrefix}/#{linkFileName}"
      @_getExportHTML linkFileName, type, hosts
    htmlArr = _.map resultFiles, (result) =>
      if _.isArray result
        mergeFile result
      else if merge && !@_isFilter result
        otherFiles.push result
        ''
      else
        @_getExportHTML result, type, hosts
    if otherFiles.length
      htmlArr.push mergeFile otherFiles
    htmlArr.join ''

  ###*
   * _isFilter 判断该文件是否应该过滤的
   * @param  {String}  file 引入文件路径
   * @return {Boolean}      [description]
  ###
  _isFilter : (file) ->
    if file.substring(0, 7) == 'http://' || file.substring(0, 8) == 'https://'
      true
    else
      false
  ###*
   * _getExportHTML 返回生成的HTML
   * @param  {String} file   引入的文件
   * @param  {String} type   文件类型
   * @param  {String} hosts 静态文件的host
   * @return {String} 返回相应的html
  ###
  _getExportHTML : (file, type, hosts) ->
    html = ''
    switch type
      when 'js' then html = @_exportJsHTML file, hosts
      else html = @_exportCssHTML file, hosts
    return html

  ###*
   * _exportJsHTML 返回引入JS的标签HTML
   * @param  {String} file   引入的文件
   * @return {String} 返回相应的html
  ###
  _exportJsHTML : (file, hosts) ->
    url = @_getUrl file, hosts
    '<script type="text/javascript" src="' + url + '"></script>'

  ###*
   * _exportCssHTML 返回引入CSS标签的HTML
   * @param  {String} file   引入的文件
   * @return {String} 返回相应的html
  ###
  _exportCssHTML : (file, hosts) ->
    url = @_getUrl file, hosts
    '<link rel="stylesheet" href="' + url + '" type="text/css" />'
  ###*
   * _getUrl 获取引用文件的URL
   * @param  {String} file 文件路径
   * @param  {String, Array} hosts 文件域名
   * @return {[type]}      [description]
  ###
  _getUrl : (file, hosts) ->
    version = config.version
    urlPrefix = config.urlPrefix
    if urlPrefix.charAt(0) != '/'
      urlPrefix = '/' + urlPrefix
    if !@_isFilter file
      if version
        file += "?version=#{version}"
      if file.charAt(0) != '/'
        file = '/' + file
      if urlPrefix
        file = "#{urlPrefix}#{file}"
      if hosts
        index = file.length % hosts.length
        file = hosts[index] + file
    file
  ###*
   * _convertExt 转换文件后缀
   * @param  {[type]} file [description]
   * @return {[type]}      [description]
  ###
  _convertExt : (file) ->
    convertExts = FileImporter.convertExts
    if convertExts?.src && convertExts.dst
      dstExt = -1
      srcExt = _.find convertExts.src, (ext, i) ->
        if ext == file.substring file.length - ext.length
          dstExt = convertExts.dst[i]
          true
        else
          false
      if srcExt && dstExt
        file = file.substring(0, file.length - srcExt.length) + dstExt
    file
module.exports = FileImporter

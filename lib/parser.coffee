_ = require 'underscore'


path = require 'path'
express = require 'express'
express.mime.types['less'] = 'text/css'
express.mime.types['styl'] = 'text/css'
express.mime.types['coffee'] = 'application/javascript'
isProductionMode = process.env.NODE_ENV == 'production'
parser = 
  ###*
   * parseLess 编译less
   * @param  {String} data less的内容
   * @param  {Object} options 编译的选项
   * @param  {Function} cbf 回调函数
   * @return {parser}
  ###
  parseLess : (data, options, cbf) ->
    less = require 'less'
    paths = options.paths
    delete options.paths
    env = 
      paths : paths
    parser = new less.Parser env
    parser.parse data, (err, tree) ->
      if err
        cbf err
      else
        cssStr = tree.toCSS options
        cbf null, cssStr
    return @
  ###*
   * parseCoffee 编译coffee
   * @param  {String} data coffee内容
   * @param  {Object} minifyOptions 编译选项
   * @param  {Function} cbf 回调函数
   * @return {parser}
  ###
  parseCoffee : (data, minifyOptions, cbf) ->
    coffeeScript = require 'coffee-script'
    try
      jsStr = coffeeScript.compile data
    catch err
      cbf err
      return
    if _.isFunction minifyOptions
      cbf = minifyOptions
      minifyOptions = null
    if minifyOptions
      uglifyJS = require 'uglify-js'
      minifyCode = uglifyJS.minify jsStr, minifyOptions
      jsStr = minifyCode.code
    cbf null, jsStr
    @
  ###*
   * parseStylus 编译stylus
   * @param  {String} data stylus内容
   * @param  {Object} options 编译选项
   * @param  {Function} cbf 回调函数
   * @return {parser}
  ###
  parseStylus : (data, options, cbf) ->
    stylus = require 'stylus'
    stylus.render data, options, cbf
    return @

parserHandler = 
  parseExts : ['.less', '.coffee', '.styl']
  ###*
   * less less编译
   * @param  {String} file 文件名
   * @param  {String} data 文件数据
   * @param  {Function} cbf  回调函数
   * @return {[type]}      [description]
  ###
  less : (file, data, cbf) ->
    options = 
      paths : [path.dirname file]
      filename : file
    if isProductionMode
      options.compress = true
    parser.parseLess data, options, cbf

  ###*
   * coffee coffee编译
   * @param  {String} file 文件名
   * @param  {String} data 文件数据
   * @param  {Function} cbf 回调函数
   * @return {[type]}      [description]
  ###
  coffee : (file, data, cbf) ->
    if isProductionMode
      options = 
        fromString : true
        warnings : true
    parser.parseCoffee data, options, (err, jsStr) ->
      if err
        err.file = file
      cbf err, jsStr
  ###*
   * styl stylus编译
   * @param  {String} file 文件名
   * @param  {String} data 文件数据
   * @param  {Function} cbf 回调函数
   * @return {[type]}      [description]
  ###
  styl : (file, data, cbf) ->
    options = 
      filename : file
    if isProductionMode
      options.compress = true
    parser.parseStylus data, options, cbf

module.exports = 
  parse : (file, data, cbf) ->
    ext = path.extname file
    handler = parserHandler[ext.substring 1]
    if _.isFunction handler
      handler file, data, cbf
    else
      err = new Error
      err.msg = "Not support the file type #{ext}"
      cbf err
  add : (ext, mimeType, handler) ->
    parserHandler.parseExts.push ext
    type = ext.substring 1
    parserHandler[type] = handler
    express.mime.types[type] = mimeType
  getParseExts : ->
    parserHandler.parseExts
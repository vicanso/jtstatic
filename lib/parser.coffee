_ = require 'underscore'
less = require 'less'
coffeeScript = require 'coffee-script'
stylus = require 'stylus'
uglifyJS = require 'uglify-js'
parser = 
  ###*
   * parseLess 编译less
   * @param  {String} data less的内容
   * @param  {Object} options 编译的选项
   * @param  {Function} cbf 回调函数
   * @return {parser}
  ###
  parseLess : (data, options, cbf) ->
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
    jsStr = coffeeScript.compile data
    if _.isFunction minifyOptions
      cbf = minifyOptions
      minifyOptions = null
    if minifyOptions
      minifyCode = uglifyJS.minify jsStr, minifyOptions
      jsStr = minifyCode.code
    cbf null, jsStr
    return @
  ###*
   * parseStylus 编译stylus
   * @param  {String} data stylus内容
   * @param  {Object} options 编译选项
   * @param  {Function} cbf 回调函数
   * @return {parser}
  ###
  parseStylus : (data, options, cbf) ->
    stylus.render data, options, cbf
    return @

module.exports = parser
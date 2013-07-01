
path = require 'path'
_ = require 'underscore'
fs = require 'fs'
config = require './config'
parser = require './parser'
async = require 'async'
uglifyJS = require 'uglify-js'
otherParser = 
  ###*
   * parser 其它类型的paser处理
   * @param  {String} staticPath 静态文件目录
   * @return {[type]}            [description]
  ###
  parser : (staticPath) ->
    url = require 'url'
    return (req, res, next) ->
      pathname = url.parse(req.url).pathname
      ext = path.extname pathname
      isNotMin = jsIsNotMin pathname
      if (config.isProductionMode && isNotMin) || ~_.indexOf parser.getParseExts(), ext
        write = res.write
        end = res.end
        bufList = []
        bufLength = 0
        res.write = (chunk, encoding) ->
          bufList.push chunk
          bufLength += chunk.length
        res.end = (chunk, encoding) ->
          self = @
          if Buffer.isBuffer chunk
            bufList.push chunk
            bufLength += chunk.length
          str = Buffer.concat(bufList, bufLength).toString encoding
          file = path.join staticPath, pathname
          async.waterfall [
            (cbf) ->
              if isNotMin
                cbf null, uglifyJS.minify(str, {fromString : true}).code
              else
                parser.parse file, str, cbf
            (data, cbf) ->
              buf = new Buffer data, encoding
              res.header 'Content-Length' , buf.length
              write.call res, buf
              end.call res
          ], (err) ->
            if err
              console.error err
              if !config.isProductionMode
                throw err
      next()


jsIsNotMin = (file) ->
  jsExt = '.js'
  jsMinExt = '.min.js'
  if jsExt == file.substring(file.length - jsExt.length) && jsMinExt != file.substring file.length - jsMinExt.length
    true
  else
    false
module.exports = otherParser
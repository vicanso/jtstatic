
path = require 'path'
_ = require 'underscore'
fs = require 'fs'
config = require './config'
parser = require './parser'
async = require 'async'
otherParser = 
  ###*
   * parser 其它类型的paser处理
   * @param  {String} staticPath 静态文件目录
   * @return {[type]}            [description]
  ###
  parser : (staticPath) ->
    url = require 'url'
    (req, res, next) ->
      pathname = url.parse(req.url).pathname
      ext = path.extname pathname
      if ~_.indexOf parser.getParseExts(), ext
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
          if !bufLength
            if !res.headerSent
              end.call res
            return
          str = Buffer.concat(bufList, bufLength).toString encoding
          file = path.join staticPath, pathname
          async.waterfall [
            (cbf) ->
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
module.exports = otherParser
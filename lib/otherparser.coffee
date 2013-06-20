
path = require 'path'
jtUtil = require 'jtutil'
_ = require 'underscore'
fs = require 'fs'
config = require './config'
parser = require './parser'



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
          buf = Buffer.concat bufList, bufLength
          file = path.join staticPath, pathname
          parser.parse file, buf.toString(encoding), (err, data) ->
            if err
              console.error err
              if !config.isProductionMode
                throw err
            else
              buf = new Buffer data, encoding
              res.header 'Content-Length' , buf.length
              write.call res, buf
              end.call res
      next()




module.exports = otherParser
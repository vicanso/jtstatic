express = require 'express'
path = require 'path'
jtUtil = require 'jtutil'
_ = require 'underscore'
fs = require 'fs'
config = require './config'
parser = require './parser'
express.mime.types['less'] = 'text/css'
express.mime.types['styl'] = 'text/css'
express.mime.types['coffee'] = 'application/javascript'


otherParser = 
  ###*
   * parser 其它类型的paser处理
   * @param  {String} staticPath 静态文件目录
   * @return {[type]}            [description]
  ###
  parser : (staticPath) ->
    url = require 'url'
    parseExts = ['.less', '.coffee', '.styl']
    return (req, res, next) ->
      pathname = url.parse(req.url).pathname
      ext = path.extname pathname
      if ~_.indexOf parseExts, ext
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
          handle file, buf.toString(encoding), (err, data) ->
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

###*
 * handle 处理方法（现有处理less,coffee）
 * @param  {String} file 文件名
 * @param  {String} data 文件数据
 * @param  {Function} cbf 回调函数
 * @return {[type]}      [description]
###
handle = (file, data, cbf) ->
  ext = path.extname file
  switch ext
    when '.less' then parseLess file, data, cbf
    when '.coffee' then parseCoffee file, data, cbf
    when '.styl' then parseStylus file, data, cbf

###*
 * parseLess less编译
 * @param  {String} file 文件名
 * @param  {String} data 文件数据
 * @param  {Function} cbf  回调函数
 * @return {[type]}      [description]
###
parseLess = (file, data, cbf) ->
  options = 
    paths : [path.dirname file]
    filename : file
  if config.isProductionMode
    options.compress = true
  parser.parseLess data, options, cbf

###*
 * parseCoffee coffee编译
 * @param  {String} file 文件名
 * @param  {String} data 文件数据
 * @param  {Function} cbf 回调函数
 * @return {[type]}      [description]
###
parseCoffee = (file, data, cbf) ->
  if config.isProductionMode
    options = 
      fromString : true
      warnings : true
  parser.parseCoffee data, options, (err, jsStr) ->
    if err
      err.file = file
    cbf err, jsStr

###*
 * parseStylus stylus编译
 * @param  {String} file 文件名
 * @param  {String} data 文件数据
 * @param  {Function} cbf 回调函数
 * @return {[type]}      [description]
###
parseStylus = (file, data, cbf) ->
  options = 
    filename : file
  if config.isProductionMode
    options.compress = true
  parser.parseStylus data, options, cbf


module.exports = otherParser
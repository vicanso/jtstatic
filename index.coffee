_ = require 'underscore'

FileImporter = require './lib/fileimporter'
staticHandler = require './lib/static'
config = require './lib/config'
fs = require 'fs'
path = require 'path'
parser = require './lib/parser'
inlineImage = require './lib/inlineimage'
jtStatic = 
  FileImporter : FileImporter
  static : staticHandler.handler
  emptyMergePath : (mergePath = config.mergePath) ->
    fs.readdir mergePath, (err, files) ->
      _.each files, (file) ->
        fs.unlink path.join(mergePath, file), ->
  configure : (key, value) ->
    if _.isObject key
      _.extend config, key
    else
      config[key] = value
  addParser : parser.add
  convertExts : (exts) ->
    FileImporter.convertExts = exts
  url : (options) ->
    filePath = options.path
    config.inlineImage = true
    config.inlineImageSizeLimit = options.limit if options.limit
    (req, res, next) ->
      file = path.join filePath, req.url
      ext = path.extname file
      if ext == '.css'
        write = res.write
        end = res.end
        bufList = []
        bufLength = 0
        res.write = (chunk, encoding) ->
          bufList.push chunk
          bufLength += chunk.length
        res.end = (chunk, encoding) ->
          if Buffer.isBuffer chunk
            bufList.push chunk
            bufLength += chunk.length
          str = Buffer.concat(bufList, bufLength).toString encoding
          inlineImage.url str, file, (err, data) ->
            if err
              next err
            else
              buf = new Buffer data, encoding
              res.header 'Content-Length' , buf.length
              write.call res, buf
              end.call res
      next()
      
module.exports = jtStatic
# config = require './config'
express = require 'express'
async = require 'async'
path = require 'path'
isProductionMode = process.env.NODE_ENV == 'production'
staticHandler =
  handler : (options) ->
    options.maxAge ?= 300
    handler = express.static "#{options.path}", {
      maxAge : options.maxAge * 1000
      redirect : false
    }
    otherParser = require('./otherparser').parser options.path
    defaultHeaders = options.headers
    (req, res, next) ->
      if defaultHeaders
        res.header defaultHeaders
      url = req.url
      mergeUrlPrefix = options.mergeUrlPrefix
      if mergeUrlPrefix.charAt(0) != '/'
        mergeUrlPrefix = '/' + mergeUrlPrefix
      if mergeUrlPrefix.charAt(mergeUrlPrefix.length - 1) != '/'
        mergeUrlPrefix += '/'
      if url.indexOf(mergeUrlPrefix) == 0
        mergeFileHandle path.join(options.path, url), ->
          handler req, res, next
      else
        otherParser req, res, () ->
          handler req, res, next
###*
 * mergeFileHandle 合并文件夹的文件处理
 * @param  {String} file 文件名
 * @param  {Function} cbf 回调函数
 * @return {[type]}      [description]
###
mergeFileHandle = (file, cbf) ->
  fs = require 'fs'
  count = 0
  maxCount = 40
  index = file.indexOf '?'
  if ~index
    file = file.substring 0, index
  async.whilst () ->
    return count < maxCount
  , (cbf) ->
    fs.exists file, (exists) ->
      if exists
        count = maxCount
        cbf()
      else
        count++
        GLOBAL.setTimeout cbf, 50
  , cbf


module.exports.handler = staticHandler.handler
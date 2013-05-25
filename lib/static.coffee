config = require './config'
express = require 'express'
async = require 'async'
path = require 'path'

staticHandler =
  handler : ->
    handler = express.static "#{config.path}", {
      maxAge : config.maxAge || 300 * 1000
      redirect : false
    }
    otherParser = require('./otherparser').parser config.path
    (req, res) ->
      url = req.url
      mergeUrlPrefix = config.mergeUrlPrefix
      notFound = ->
        res.send 404, ''
        res.end()
      if mergeUrlPrefix.charAt(0) != '/'
        mergeUrlPrefix = '/' + mergeUrlPrefix
      if mergeUrlPrefix.charAt(mergeUrlPrefix.length - 1) != '/'
        mergeUrlPrefix += '/'
      if url.indexOf(mergeUrlPrefix) == 0
        mergeFileHandle path.join(config.path, url), ->
          handler req, res, notFound
      else
        otherParser req, res, () ->
          handler req, res, notFound
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
  , (err) ->
    cbf()


module.exports = staticHandler
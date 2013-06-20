_ = require 'underscore'

FileImporter = require './lib/fileimporter'
staticHandler = require './lib/static'
config = require './lib/config'
fs = require 'fs'
path = require 'path'
parser = require './lib/parser'

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

module.exports = jtStatic
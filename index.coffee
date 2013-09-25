_ = require 'underscore'

FileImporter = require './lib/fileimporter'
staticHandler = require './lib/static'
fs = require 'fs'
path = require 'path'
parser = require './lib/parser'
inlineImage = require './lib/inlineimage'
class JTStatic
  constructor : (options)->
    defaults = 
      # 静态文件所在目录
      path : ''
      # 静态文件前缀，在引入的时候自动添加
      urlPrefix : ''
      # 静态文件URL后缀的版本号，可不加
      version : ''
      # 合并文件存放的目录
      mergePath : ''
      # 合并文件列表
      mergeList : null
      # 是否使用内联图片，base64的形式
      inlineImage : false
      inlineImageSizeLimit : 15 * 1024
      if options?.convertExts
        FileImporter.convertExts = options.convertExts
        delete options.convertExts
    @options = _.extend defaults, options
  ###*
   * getFileImporter 获取fileImporter实例
   * @param  {[type]} hosts [description]
   * @return {[type]}      [description]
  ###
  getFileImporter : (hosts) ->
    new FileImporter hosts, @options
  ###*
   * static 静态处理文件的middleware
   * @return {[type]} [description]
  ###
  static : (options) ->
    staticHandler.handler _.extend {}, @options, options
  ###*
   * emptyMergePath 清空临时合并目录（原则上每次deploy都要清空）
   * @param  {[type]} mergePath =             @options.mergePath [description]
   * @return {[type]}           [description]
  ###
  emptyMergePath : (mergePath = @options.mergePath) ->
    fs.readdir mergePath, (err, files) ->
      _.each files, (file) ->
        fs.unlink path.join(mergePath, file), ->
  ###*
   * [configure description]
   * @param  {[type]} key   [description]
   * @param  {[type]} value [description]
   * @return {[type]}       [description]
  ###
  configure : (key, value) ->
    if _.isObject key
      if key?.convertExts
        FileImporter.convertExts = key.convertExts
        delete key.convertExts
      _.extend @options, key
    else
      if key == 'convertExts'
        FileImporter.convertExts = value
      else
        @options[key] = value
  ###*
   * addParser 添加其它可处理的文件，如scss。（建议在prodution环境中，将所有需要编译的文件都编译之后再deploy，不实时编译）
   * @type {[type]}
  ###
  addParser : parser.add
  ###*
   * convertExts 转换的文件后缀，使用的条件如：在develop中引入test.coffee，便在production中，该文件已被编译成test.js，为了方便不用将引入的文件修改，可在production添加引入文件的后缀转换对照
   * @param  {[type]} exts [description]
   * @return {[type]}      [description]
  ###
  convertExts : (exts) ->
    FileImporter.convertExts = exts
  ###*
   * url 将css中的引入的图片转换为base64的方式引入
   * @param  {[type]} options [description]
   * @return {[type]}         [description]
  ###
  url : (options) ->
    filePath = options.path
    limit = options.limit
    (req, res, next) ->
      file = path.join filePath, req.url
      ext = path.extname file
      if ext == '.css'
        urlHandle res, file, limit
      next()

urlHandle = (res, file, limit) ->
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
    inlineImage.url str, file, limit (err, data) ->
      if err
        next err
      else
        buf = new Buffer data, encoding
        res.header 'Content-Length' , buf.length
        write.call res, buf
        end.call res

JTStatic.url = JTStatic::url  
module.exports = JTStatic
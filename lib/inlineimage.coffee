_ = require 'underscore'
path = require 'path'
fs = require 'fs'
async = require 'async'
config = require './config'
inlineImage =
  ###*
   * url css中的URL处理
   * @param  {[type]} data     [description]
   * @param  {[type]} file     [description]
   * @param  {[type]} saveFile [description]
   * @param  {[type]} cbf      [description]
   * @return {[type]}          [description]
  ###
  url : (data, file, saveFile, cbf) ->
    if _.isFunction saveFile
      cbf = saveFile
      saveFile = ''
    if saveFile
      imagesPath = path.relative path.dirname(saveFile), path.dirname(file)
    imageInlineHandle = @imageInlineHandle {
      path : path.dirname file
    }
    reg = /background(-image)?\s*?:[\s\S]*?url\(([\s\S]*?)\)[\s\S]*?;/g
    cssData = []
    result = null
    startIndex = 0
    async.whilst ->
      (result = reg.exec(data)) != null
    , (cbf) ->
      css = result[0]
      replaceImageUrl = result[2]
      if replaceImageUrl.charAt(0) == '\'' || replaceImageUrl.charAt(0) == '"'
      	imgUrl = replaceImageUrl.substring 1, replaceImageUrl.length - 1
      else
      	imgUrl = replaceImageUrl
      cssData.push data.substring startIndex, result.index
      startIndex = result.index
      if imgUrl.charAt(0) != '/' && imgUrl.indexOf 'data:'
        imageInlineHandle imgUrl, (err, dataUri) ->
          newImgUrl = ''
          if dataUri
            newImgUrl = dataUri
          else if imagesPath
            newImgUrl = path.join(imagesPath, imgUrl).replace /\\/g, '\/'
          if newImgUrl
            newCss = css.replace replaceImageUrl, '"' + newImgUrl + '"'
          if newCss && newCss != css
            cssData.push newCss
            if dataUri
              cssData.push "*#{css}"
            startIndex += css.length
          cbf err
      else
        cbf null
    , (err) ->
      cssData.push data.substring startIndex
      cbf err, cssData.join ''
    @
  ###*
   * imageInlineHandle 内联图片处理
   * @param  {[type]} options {path : xxx, limit : xxx}
   * @return {[type]}         [description]
  ###
  imageInlineHandle : (options) ->
    filePath = options.path
    limit = options.limit || config.inlineImageSizeLimit
    mimes =
      '.gif' : 'image/gif'
      '.png' : 'image/png'
      '.jpg' : 'image/jpeg'
      '.jpeg' : 'image/jpeg'
      '.svg' : 'image/svg+xml'
    (file, cbf) ->
      ext = path.extname file
      mime = mimes[ext]
      if !config.inlineImage || !file.indexOf 'http' || !mime
        cbf null, ''
        return
      file = path.join filePath, file
      async.waterfall [
        (cbf) ->
          fs.exists file, (exists) ->
            if exists
              fs.readFile file, cbf
            else
              cbf null, ''
        (data, cbf) ->
          if !data || data.length > limit
            cbf null, ''
          else
            cbf null, "data:#{mime};base64,#{data.toString('base64')}"
      ], cbf

module.exports = inlineImage
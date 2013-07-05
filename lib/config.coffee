fs = require 'fs'
path = require 'path'
_ = require 'underscore'

config = 
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
config.isProductionMode = process.env.NODE_ENV == 'production'
module.exports = config

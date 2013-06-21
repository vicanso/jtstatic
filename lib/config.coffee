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
config.isProductionMode = process.env.NODE_ENV is 'production'
module.exports = config

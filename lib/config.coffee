fs = require 'fs'
path = require 'path'
_ = require 'underscore'

config = 
  path : ''
  urlPrefix : ''
  version : ''
  mergePath : ''
  mergeList : null
config.isProductionMode = process.env.NODE_ENV is 'production'
module.exports = config

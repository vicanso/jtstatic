jtStatic = require '../index'
sass = require 'sass'

jtStatic.configure 
  path : "#{__dirname}/static"
  urlPrefix : '/static'
  mergePath : "#{__dirname}/static/temp"
  mergeUrlPrefix : '/temp'
  maxAge : 300 * 1000
  headers : 
    'v-ttl' : '10m'
  version : Math.floor Date.now() / 1000
  inlineImage : true
  mergeList : [
    ['/javascripts/utils/underscore.min.js', '/javascripts/utils/backbone.min.js', '/javascripts/utils/async.min.js']
  ]
jtStatic.emptyMergePath()

jtStatic.addParser '.sass', 'text/css', (file, data, cbf) ->
  cbf null, sass.render data
# jtStatic.convertExts {
#   src : ['.min.js']
#   dst : ['.js']
# }

express = require 'express'

app = express()

app.set 'view engine', 'jade'
app.set 'views', './views'

app.use '/static', jtStatic.static()

# jtStatic.configure 'hosts', ['http://test1.com', 'http://test2.com']

app.get '/', (req, res) ->
  # fileImporter = new jtStatic.FileImporter debugMode, hosts
  fileImporter = new jtStatic.FileImporter
  res.render 'index', {
    fileImporter : fileImporter
    title : '测试标题'
  }, (err, html) ->
    css = fileImporter.exportCss true
    js = fileImporter.exportJs true
    html = html.replace('<!--CSS_FILES_CONTAINER-->', css).replace '<!--JS_FILES_CONTAINER-->', js
    res.send html
app.listen 8080

console.log 'listen on 8080!'
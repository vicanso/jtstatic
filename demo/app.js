(function() {
  var app, express, jtStatic;

  jtStatic = require('../index');

  jtStatic.configure({
    path: "" + __dirname + "/static",
    urlPrefix: '/static',
    mergePath: "" + __dirname + "/static/temp",
    mergeUrlPrefix: 'temp',
    maxAge: 300 * 1000,
    version: Math.floor(Date.now()),
    mergeList: [['/javascripts/utils/underscore.min.js', '/javascripts/utils/backbone.min.js', '/javascripts/utils/async.min.js']]
  });

  jtStatic.emptyMergePath();

  express = require('express');

  app = express();

  app.set('view engine', 'jade');

  app.set('views', './views');

  app.use('/static', jtStatic["static"]());

  app.get('/', function(req, res) {
    var debugMode, fileImporter, hosts;
    debugMode = false;
    hosts = ['http://test1.com', 'http://test2.com'];
    fileImporter = new jtStatic.FileImporter(debugMode);
    return res.render('index', {
      fileImporter: fileImporter,
      title: '测试标题'
    }, function(err, html) {
      var css, js;
      css = fileImporter.exportCss(!debugMode);
      js = fileImporter.exportJs(!debugMode);
      html = html.replace('<!--CSS_FILES_CONTAINER-->', css).replace('<!--JS_FILES_CONTAINER-->', js);
      return res.end(html);
    });
  });

  app.listen(8080);

}).call(this);

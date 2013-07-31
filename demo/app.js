(function() {
  var JTStatic, app, express, jtStatic, sass;

  JTStatic = require('../index');

  sass = require('sass');

  jtStatic = new JTStatic({
    path: "" + __dirname + "/static",
    urlPrefix: '/static',
    mergePath: "" + __dirname + "/static/temp",
    mergeUrlPrefix: '/temp',
    maxAge: 300,
    version: Math.floor(Date.now() / 1000),
    inlineImage: false,
    mergeList: [['/javascripts/utils/underscore.min.js', '/javascripts/utils/backbone.min.js', '/javascripts/utils/async.min.js']]
  });

  jtStatic.emptyMergePath();

  jtStatic.addParser('.sass', 'text/css', function(file, data, cbf) {
    return cbf(null, sass.render(data));
  });

  express = require('express');

  app = express();

  app.set('view engine', 'jade');

  app.set('views', './views');

  app.use('/static', jtStatic["static"]());

  app.get('/', function(req, res) {
    var fileImporter;
    fileImporter = jtStatic.getFileImporter();
    return res.render('index', {
      fileImporter: fileImporter,
      title: '测试标题'
    }, function(err, html) {
      var css, js;
      css = fileImporter.exportCss(true);
      js = fileImporter.exportJs(true);
      html = html.replace('<!--CSS_FILES_CONTAINER-->', css).replace('<!--JS_FILES_CONTAINER-->', js);
      return res.send(html);
    });
  });

  app.listen(8080);

  console.log('listen on 8080!');

}).call(this);

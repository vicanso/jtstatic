(function() {
  var app, express, jtStatic;

  jtStatic = require('../index');

  express = require('express');

  app = express();

  app.use('/static', jtStatic.url({
    path: __dirname + '/static',
    limit: 100 * 1024
  }));

  app.use('/static', express["static"](__dirname + '/static'));

  app.listen(8080);

  console.log('listen on 8080!');

}).call(this);

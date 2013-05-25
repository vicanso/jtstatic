(function() {
  var config, express, fs, handle, jtUtil, otherParser, parseCoffee, parseLess, parseStylus, parser, path, _;

  express = require('express');

  path = require('path');

  jtUtil = require('jtutil');

  _ = require('underscore');

  fs = require('fs');

  config = require('./config');

  parser = require('./parser');

  express.mime.types['less'] = 'text/css';

  express.mime.types['styl'] = 'text/css';

  express.mime.types['coffee'] = 'application/javascript';

  otherParser = {
    /**
     * parser 其它类型的paser处理
     * @param  {String} staticPath 静态文件目录
     * @return {[type]}            [description]
    */

    parser: function(staticPath) {
      var parseExts, url;
      url = require('url');
      parseExts = ['.less', '.coffee', '.styl'];
      return function(req, res, next) {
        var bufLength, bufList, end, ext, pathname, write;
        pathname = url.parse(req.url).pathname;
        ext = path.extname(pathname);
        if (~_.indexOf(parseExts, ext)) {
          write = res.write;
          end = res.end;
          bufList = [];
          bufLength = 0;
          res.write = function(chunk, encoding) {
            bufList.push(chunk);
            return bufLength += chunk.length;
          };
          res.end = function(chunk, encoding) {
            var buf, file, self;
            self = this;
            if (Buffer.isBuffer(chunk)) {
              bufList.push(chunk);
              bufLength += chunk.length;
            }
            buf = Buffer.concat(bufList, bufLength);
            file = path.join(staticPath, pathname);
            return handle(file, buf.toString(encoding), function(err, data) {
              if (err) {
                throw err;
              } else {
                buf = new Buffer(data, encoding);
                res.header('Content-Length', buf.length);
                return end.call(res, buf);
              }
            });
          };
        }
        return next();
      };
    }
  };

  /**
   * handle 处理方法（现有处理less,coffee）
   * @param  {String} file 文件名
   * @param  {String} data 文件数据
   * @param  {Function} cbf 回调函数
   * @return {[type]}      [description]
  */


  handle = function(file, data, cbf) {
    var ext;
    ext = path.extname(file);
    switch (ext) {
      case '.less':
        return parseLess(file, data, cbf);
      case '.coffee':
        return parseCoffee(file, data, cbf);
      case '.styl':
        return parseStylus(file, data, cbf);
    }
  };

  /**
   * parseLess less编译
   * @param  {String} file 文件名
   * @param  {String} data 文件数据
   * @param  {Function} cbf  回调函数
   * @return {[type]}      [description]
  */


  parseLess = function(file, data, cbf) {
    var options;
    options = {
      paths: [path.dirname(file)],
      filename: file
    };
    if (config.isProductionMode) {
      options.compress = true;
    }
    return parser.parseLess(data, options, cbf);
  };

  /**
   * parseCoffee coffee编译
   * @param  {String} file 文件名
   * @param  {String} data 文件数据
   * @param  {Function} cbf 回调函数
   * @return {[type]}      [description]
  */


  parseCoffee = function(file, data, cbf) {
    var options;
    if (config.isProductionMode) {
      options = {
        fromString: true,
        warnings: true
      };
    }
    return parser.parseCoffee(data, options, function(err, jsStr) {
      if (err) {
        err.file = file;
      }
      return cbf(err, jsStr);
    });
  };

  /**
   * parseStylus stylus编译
   * @param  {String} file 文件名
   * @param  {String} data 文件数据
   * @param  {Function} cbf 回调函数
   * @return {[type]}      [description]
  */


  parseStylus = function(file, data, cbf) {
    var options;
    options = {
      filename: file
    };
    if (config.isProductionMode) {
      options.compress = true;
    }
    return parser.parseStylus(data, options, cbf);
  };

  module.exports = otherParser;

}).call(this);

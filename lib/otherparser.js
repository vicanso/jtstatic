(function() {
  var config, fs, jtUtil, otherParser, parser, path, _;

  path = require('path');

  jtUtil = require('jtutil');

  _ = require('underscore');

  fs = require('fs');

  config = require('./config');

  parser = require('./parser');

  otherParser = {
    /**
     * parser 其它类型的paser处理
     * @param  {String} staticPath 静态文件目录
     * @return {[type]}            [description]
    */

    parser: function(staticPath) {
      var url;
      url = require('url');
      return function(req, res, next) {
        var bufLength, bufList, end, ext, pathname, write;
        pathname = url.parse(req.url).pathname;
        ext = path.extname(pathname);
        if (~_.indexOf(parser.getParseExts(), ext)) {
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
            return parser.parse(file, buf.toString(encoding), function(err, data) {
              if (err) {
                console.error(err);
                if (!config.isProductionMode) {
                  throw err;
                }
              } else {
                buf = new Buffer(data, encoding);
                res.header('Content-Length', buf.length);
                write.call(res, buf);
                return end.call(res);
              }
            });
          };
        }
        return next();
      };
    }
  };

  module.exports = otherParser;

}).call(this);

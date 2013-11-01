(function() {
  var async, fs, isProductionMode, otherParser, parser, path, _;

  path = require('path');

  _ = require('underscore');

  fs = require('fs');

  isProductionMode = process.env.NODE_ENV === 'production';

  parser = require('./parser');

  async = require('async');

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
            var file, self, str;
            self = this;
            if (Buffer.isBuffer(chunk)) {
              bufList.push(chunk);
              bufLength += chunk.length;
            }
            if (!bufLength) {
              if (!res.headerSent) {
                end.call(res);
              }
              return;
            }
            str = Buffer.concat(bufList, bufLength).toString(encoding);
            file = path.join(staticPath, pathname);
            return async.waterfall([
              function(cbf) {
                return parser.parse(file, str, cbf);
              }, function(data, cbf) {
                var buf;
                buf = new Buffer(data, encoding);
                res.header('Content-Length', buf.length);
                write.call(res, buf);
                return end.call(res);
              }
            ], function(err) {
              if (err) {
                console.error(err);
                if (!isProductionMode) {
                  throw err;
                }
              }
            });
          };
        }
        return next();
      };
    }
  };

  module.exports.parser = otherParser.parser;

}).call(this);

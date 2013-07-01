(function() {
  var async, config, fs, jsIsNotMin, otherParser, parser, path, uglifyJS, _;

  path = require('path');

  _ = require('underscore');

  fs = require('fs');

  config = require('./config');

  parser = require('./parser');

  async = require('async');

  uglifyJS = require('uglify-js');

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
        var bufLength, bufList, end, ext, isNotMin, pathname, write;
        pathname = url.parse(req.url).pathname;
        ext = path.extname(pathname);
        isNotMin = jsIsNotMin(pathname);
        if ((config.isProductionMode && isNotMin) || ~_.indexOf(parser.getParseExts(), ext)) {
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
            str = Buffer.concat(bufList, bufLength).toString(encoding);
            file = path.join(staticPath, pathname);
            return async.waterfall([
              function(cbf) {
                if (isNotMin) {
                  return cbf(null, uglifyJS.minify(str, {
                    fromString: true
                  }).code);
                } else {
                  return parser.parse(file, str, cbf);
                }
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
                if (!config.isProductionMode) {
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

  jsIsNotMin = function(file) {
    var jsExt, jsMinExt;
    jsExt = '.js';
    jsMinExt = '.min.js';
    if (jsExt === file.substring(file.length - jsExt.length) && jsMinExt !== file.substring(file.length - jsMinExt.length)) {
      return true;
    } else {
      return false;
    }
  };

  module.exports = otherParser;

}).call(this);

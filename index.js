(function() {
  var FileImporter, config, fs, inlineImage, jtStatic, parser, path, staticHandler, _;

  _ = require('underscore');

  FileImporter = require('./lib/fileimporter');

  staticHandler = require('./lib/static');

  config = require('./lib/config');

  fs = require('fs');

  path = require('path');

  parser = require('./lib/parser');

  inlineImage = require('./lib/inlineimage');

  jtStatic = {
    FileImporter: FileImporter,
    "static": staticHandler.handler,
    emptyMergePath: function(mergePath) {
      if (mergePath == null) {
        mergePath = config.mergePath;
      }
      return fs.readdir(mergePath, function(err, files) {
        return _.each(files, function(file) {
          return fs.unlink(path.join(mergePath, file), function() {});
        });
      });
    },
    configure: function(key, value) {
      if (_.isObject(key)) {
        return _.extend(config, key);
      } else {
        return config[key] = value;
      }
    },
    addParser: parser.add,
    convertExts: function(exts) {
      return FileImporter.convertExts = exts;
    },
    url: function(options) {
      var filePath;
      filePath = options.path;
      config.inlineImage = true;
      if (options.limit) {
        config.inlineImageSizeLimit = options.limit;
      }
      return function(req, res, next) {
        var bufLength, bufList, end, ext, file, write;
        file = path.join(filePath, req.url);
        ext = path.extname(file);
        if (ext === '.css') {
          write = res.write;
          end = res.end;
          bufList = [];
          bufLength = 0;
          res.write = function(chunk, encoding) {
            bufList.push(chunk);
            return bufLength += chunk.length;
          };
          res.end = function(chunk, encoding) {
            var str;
            if (Buffer.isBuffer(chunk)) {
              bufList.push(chunk);
              bufLength += chunk.length;
            }
            str = Buffer.concat(bufList, bufLength).toString(encoding);
            return inlineImage.url(str, file, function(err, data) {
              var buf;
              if (err) {
                return next(err);
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

  module.exports = jtStatic;

}).call(this);

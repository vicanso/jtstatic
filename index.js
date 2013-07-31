(function() {
  var FileImporter, JTStatic, fs, inlineImage, parser, path, staticHandler, urlHandle, _;

  _ = require('underscore');

  FileImporter = require('./lib/fileimporter');

  staticHandler = require('./lib/static');

  fs = require('fs');

  path = require('path');

  parser = require('./lib/parser');

  inlineImage = require('./lib/inlineimage');

  JTStatic = (function() {

    function JTStatic(options) {
      var defaults;
      defaults = {
        path: '',
        urlPrefix: '',
        version: '',
        mergePath: '',
        mergeList: null,
        inlineImage: false,
        inlineImageSizeLimit: 15 * 1024
      };
      if (options != null ? options.convertExts : void 0) {
        FileImporter.convertExts = options.convertExts;
        delete options.convertExts;
      }
      this.options = _.extend(defaults, options);
    }

    /**
     * getFileImporter 获取fileImporter实例
     * @param  {[type]} hosts [description]
     * @return {[type]}      [description]
    */


    JTStatic.prototype.getFileImporter = function(hosts) {
      return new FileImporter(hosts, this.options);
    };

    /**
     * static 静态处理文件的middleware
     * @return {[type]} [description]
    */


    JTStatic.prototype["static"] = function() {
      return staticHandler.handler(this.options);
    };

    /**
     * emptyMergePath 清空临时合并目录（原则上每次deploy都要清空）
     * @param  {[type]} mergePath =             @options.mergePath [description]
     * @return {[type]}           [description]
    */


    JTStatic.prototype.emptyMergePath = function(mergePath) {
      if (mergePath == null) {
        mergePath = this.options.mergePath;
      }
      return fs.readdir(mergePath, function(err, files) {
        return _.each(files, function(file) {
          return fs.unlink(path.join(mergePath, file), function() {});
        });
      });
    };

    /**
     * [configure description]
     * @param  {[type]} key   [description]
     * @param  {[type]} value [description]
     * @return {[type]}       [description]
    */


    JTStatic.prototype.configure = function(key, value) {
      if (_.isObject(key)) {
        if (key != null ? key.convertExts : void 0) {
          FileImporter.convertExts = key.convertExts;
          delete key.convertExts;
        }
        return _.extend(this.options, key);
      } else {
        if (key === 'convertExts') {
          return FileImporter.convertExts = value;
        } else {
          return this.options[key] = value;
        }
      }
    };

    /**
     * addParser 添加其它可处理的文件，如scss。（建议在prodution环境中，将所有需要编译的文件都编译之后再deploy，不实时编译）
     * @type {[type]}
    */


    JTStatic.prototype.addParser = parser.add;

    /**
     * convertExts 转换的文件后缀，使用的条件如：在develop中引入test.coffee，便在production中，该文件已被编译成test.js，为了方便不用将引入的文件修改，可在production添加引入文件的后缀转换对照
     * @param  {[type]} exts [description]
     * @return {[type]}      [description]
    */


    JTStatic.prototype.convertExts = function(exts) {
      return FileImporter.convertExts = exts;
    };

    /**
     * url 将css中的引入的图片转换为base64的方式引入
     * @param  {[type]} options [description]
     * @return {[type]}         [description]
    */


    JTStatic.prototype.url = function(options) {
      var filePath, limit;
      filePath = options.path;
      limit = options.limit;
      return function(req, res, next) {
        var ext, file;
        file = path.join(filePath, req.url);
        ext = path.extname(file);
        if (ext === '.css') {
          urlHandle(res, file, limit);
        }
        return next();
      };
    };

    return JTStatic;

  })();

  urlHandle = function(res, file, limit) {
    var bufLength, bufList, end, write;
    write = res.write;
    end = res.end;
    bufList = [];
    bufLength = 0;
    res.write = function(chunk, encoding) {
      bufList.push(chunk);
      return bufLength += chunk.length;
    };
    return res.end = function(chunk, encoding) {
      var str;
      if (Buffer.isBuffer(chunk)) {
        bufList.push(chunk);
        bufLength += chunk.length;
      }
      str = Buffer.concat(bufList, bufLength).toString(encoding);
      return inlineImage.url(str, file, limit(function(err, data) {
        var buf;
        if (err) {
          return next(err);
        } else {
          buf = new Buffer(data, encoding);
          res.header('Content-Length', buf.length);
          write.call(res, buf);
          return end.call(res);
        }
      }));
    };
  };

  JTStatic.url = JTStatic.prototype.url;

  module.exports = JTStatic;

}).call(this);

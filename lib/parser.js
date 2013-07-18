(function() {
  var express, isProductionMode, parser, parserHandler, path, _;

  _ = require('underscore');

  path = require('path');

  express = require('express');

  express.mime.types['less'] = 'text/css';

  express.mime.types['styl'] = 'text/css';

  express.mime.types['coffee'] = 'application/javascript';

  isProductionMode = process.env.NODE_ENV === 'production';

  parser = {
    /**
     * parseLess 编译less
     * @param  {String} data less的内容
     * @param  {Object} options 编译的选项
     * @param  {Function} cbf 回调函数
     * @return {parser}
    */

    parseLess: function(data, options, cbf) {
      var env, less, paths;
      less = require('less');
      paths = options.paths;
      delete options.paths;
      env = {
        paths: paths
      };
      parser = new less.Parser(env);
      parser.parse(data, function(err, tree) {
        var cssStr;
        if (err) {
          return cbf(err);
        } else {
          cssStr = tree.toCSS(options);
          return cbf(null, cssStr);
        }
      });
      return this;
    },
    /**
     * parseCoffee 编译coffee
     * @param  {String} data coffee内容
     * @param  {Object} minifyOptions 编译选项
     * @param  {Function} cbf 回调函数
     * @return {parser}
    */

    parseCoffee: function(data, minifyOptions, cbf) {
      var coffeeScript, jsStr, minifyCode, uglifyJS;
      coffeeScript = require('coffee-script');
      try {
        jsStr = coffeeScript.compile(data);
      } catch (err) {
        cbf(err);
        return;
      }
      if (_.isFunction(minifyOptions)) {
        cbf = minifyOptions;
        minifyOptions = null;
      }
      if (minifyOptions) {
        uglifyJS = require('uglify-js');
        minifyCode = uglifyJS.minify(jsStr, minifyOptions);
        jsStr = minifyCode.code;
      }
      cbf(null, jsStr);
      return this;
    },
    /**
     * parseStylus 编译stylus
     * @param  {String} data stylus内容
     * @param  {Object} options 编译选项
     * @param  {Function} cbf 回调函数
     * @return {parser}
    */

    parseStylus: function(data, options, cbf) {
      var stylus;
      stylus = require('stylus');
      stylus.render(data, options, cbf);
      return this;
    }
  };

  parserHandler = {
    parseExts: ['.less', '.coffee', '.styl'],
    /**
     * less less编译
     * @param  {String} file 文件名
     * @param  {String} data 文件数据
     * @param  {Function} cbf  回调函数
     * @return {[type]}      [description]
    */

    less: function(file, data, cbf) {
      var options;
      options = {
        paths: [path.dirname(file)],
        filename: file
      };
      if (isProductionMode) {
        options.compress = true;
      }
      return parser.parseLess(data, options, cbf);
    },
    /**
     * coffee coffee编译
     * @param  {String} file 文件名
     * @param  {String} data 文件数据
     * @param  {Function} cbf 回调函数
     * @return {[type]}      [description]
    */

    coffee: function(file, data, cbf) {
      var options;
      if (isProductionMode) {
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
    },
    /**
     * styl stylus编译
     * @param  {String} file 文件名
     * @param  {String} data 文件数据
     * @param  {Function} cbf 回调函数
     * @return {[type]}      [description]
    */

    styl: function(file, data, cbf) {
      var options;
      options = {
        filename: file
      };
      if (isProductionMode) {
        options.compress = true;
      }
      return parser.parseStylus(data, options, cbf);
    }
  };

  module.exports = {
    parse: function(file, data, cbf) {
      var err, ext, handler;
      ext = path.extname(file);
      handler = parserHandler[ext.substring(1)];
      if (_.isFunction(handler)) {
        return handler(file, data, cbf);
      } else {
        err = new Error;
        err.msg = "Not support the file type " + ext;
        return cbf(err);
      }
    },
    add: function(ext, mimeType, handler) {
      var type;
      parserHandler.parseExts.push(ext);
      type = ext.substring(1);
      parserHandler[type] = handler;
      return express.mime.types[type] = mimeType;
    },
    getParseExts: function() {
      return parserHandler.parseExts;
    }
  };

}).call(this);

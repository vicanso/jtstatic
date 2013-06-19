(function() {
  var coffeeScript, less, parser, stylus, uglifyJS, _;

  _ = require('underscore');

  less = require('less');

  coffeeScript = require('coffee-script');

  stylus = require('stylus');

  uglifyJS = require('uglify-js');

  parser = {
    /**
     * parseLess 编译less
     * @param  {String} data less的内容
     * @param  {Object} options 编译的选项
     * @param  {Function} cbf 回调函数
     * @return {parser}
    */

    parseLess: function(data, options, cbf) {
      var env, paths;
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
      var jsStr, minifyCode;
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
      stylus.render(data, options, cbf);
      return this;
    }
  };

  module.exports = parser;

}).call(this);

(function() {
  var async, express, isProductionMode, mergeFileHandle, path, staticHandler;

  express = require('express');

  async = require('async');

  path = require('path');

  isProductionMode = process.env.NODE_ENV === 'production';

  staticHandler = {
    handler: function(options) {
      var defaultHeaders, handler, otherParser;
      if (options.maxAge == null) {
        options.maxAge = 300;
      }
      handler = express["static"]("" + options.path, {
        maxAge: options.maxAge * 1000,
        redirect: false
      });
      otherParser = require('./otherparser').parser(options.path);
      defaultHeaders = options.headers;
      return function(req, res, next) {
        var mergeUrlPrefix, url;
        if (defaultHeaders) {
          res.header(defaultHeaders);
        }
        url = req.url;
        mergeUrlPrefix = options.mergeUrlPrefix;
        if (mergeUrlPrefix.charAt(0) !== '/') {
          mergeUrlPrefix = '/' + mergeUrlPrefix;
        }
        if (mergeUrlPrefix.charAt(mergeUrlPrefix.length - 1) !== '/') {
          mergeUrlPrefix += '/';
        }
        if (url.indexOf(mergeUrlPrefix) === 0) {
          return mergeFileHandle(path.join(options.path, url), function() {
            return handler(req, res, next);
          });
        } else {
          return otherParser(req, res, function() {
            return handler(req, res, next);
          });
        }
      };
    }
  };

  /**
   * mergeFileHandle 合并文件夹的文件处理
   * @param  {String} file 文件名
   * @param  {Function} cbf 回调函数
   * @return {[type]}      [description]
  */


  mergeFileHandle = function(file, cbf) {
    var count, fs, index, maxCount;
    fs = require('fs');
    count = 0;
    maxCount = 40;
    index = file.indexOf('?');
    if (~index) {
      file = file.substring(0, index);
    }
    return async.whilst(function() {
      return count < maxCount;
    }, function(cbf) {
      return fs.exists(file, function(exists) {
        if (exists) {
          count = maxCount;
          return cbf();
        } else {
          count++;
          return GLOBAL.setTimeout(cbf, 50);
        }
      });
    }, cbf);
  };

  module.exports = staticHandler;

}).call(this);

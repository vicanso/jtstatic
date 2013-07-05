(function() {
  var async, config, express, mergeFileHandle, path, staticHandler;

  config = require('./config');

  express = require('express');

  async = require('async');

  path = require('path');

  staticHandler = {
    handler: function() {
      var handler, maxAge, otherParser;
      maxAge = config.maxAge || 300 * 1000;
      if (!config.isProductionMode) {
        maxAge = 0;
      }
      handler = express["static"]("" + config.path, {
        maxAge: maxAge,
        redirect: false
      });
      otherParser = require('./otherparser').parser(config.path);
      return function(req, res) {
        var mergeUrlPrefix, notFound, url;
        url = req.url;
        mergeUrlPrefix = config.mergeUrlPrefix;
        notFound = function() {
          if (!res.headerSent) {
            res.send(404, '');
            return res.end();
          }
        };
        if (mergeUrlPrefix.charAt(0) !== '/') {
          mergeUrlPrefix = '/' + mergeUrlPrefix;
        }
        if (mergeUrlPrefix.charAt(mergeUrlPrefix.length - 1) !== '/') {
          mergeUrlPrefix += '/';
        }
        if (url.indexOf(mergeUrlPrefix) === 0) {
          return mergeFileHandle(path.join(config.path, url), function() {
            return handler(req, res, notFound);
          });
        } else {
          return otherParser(req, res, function() {
            return handler(req, res, notFound);
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

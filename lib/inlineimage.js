(function() {
  var async, fs, inlineImage, path, _;

  _ = require('underscore');

  path = require('path');

  fs = require('fs');

  async = require('async');

  inlineImage = {
    /**
     * url css中的URL处理
     * @param  {[type]} data     [description]
     * @param  {[type]} file     [description]
     * @param  {[type]} saveFile [description]
     * @param  {[type]} cbf      [description]
     * @return {[type]}          [description]
    */

    url: function(data, file, saveFile, limit, cbf) {
      var cssData, defaultLimitSize, imageInlineHandle, imagesPath, reg, result, startIndex;
      defaultLimitSize = 10 * 1024;
      if (_.isFunction(saveFile)) {
        cbf = saveFile;
        saveFile = '';
        limit = defaultLimitSize;
      }
      if (_.isNumber(saveFile)) {
        limit = saveFile;
        saveFile = '';
      }
      if (_.isFunction(limit)) {
        cbf = limit;
        limit = defaultLimitSize;
      }
      if (limit == null) {
        limit = defaultLimitSize;
      }
      if (saveFile) {
        imagesPath = path.relative(path.dirname(saveFile), path.dirname(file));
      }
      imageInlineHandle = this.imageInlineHandle({
        path: path.dirname(file),
        limit: limit
      });
      reg = /background(-image)?\s*?:[\s\S]*?url\(([\s\S]*?)\)[\s\S]*?[;\n\}]/g;
      cssData = [];
      result = null;
      startIndex = 0;
      async.whilst(function() {
        return (result = reg.exec(data)) !== null;
      }, function(cbf) {
        var css, imgUrl, replaceImageUrl;
        css = result[0];
        replaceImageUrl = result[2];
        if (replaceImageUrl.charAt(0) === '\'' || replaceImageUrl.charAt(0) === '"') {
          imgUrl = replaceImageUrl.substring(1, replaceImageUrl.length - 1);
        } else {
          imgUrl = replaceImageUrl;
        }
        cssData.push(data.substring(startIndex, result.index));
        startIndex = result.index;
        if (imgUrl.charAt(0) !== '/' && imgUrl.indexOf('data:')) {
          return imageInlineHandle(imgUrl, function(err, dataUri) {
            var newCss, newImgUrl;
            newImgUrl = '';
            if (dataUri) {
              newImgUrl = dataUri;
            } else if (imagesPath) {
              newImgUrl = path.join(imagesPath, imgUrl).replace(/\\/g, '\/');
            }
            if (newImgUrl) {
              newCss = css.replace(replaceImageUrl, '"' + newImgUrl + '"');
            }
            if (newCss && newCss !== css) {
              cssData.push(newCss);
              if (dataUri) {
                cssData.push(";*" + css);
              }
              startIndex += css.length;
            }
            return cbf(err);
          });
        } else {
          return cbf(null);
        }
      }, function(err) {
        cssData.push(data.substring(startIndex));
        return cbf(err, cssData.join(''));
      });
      return this;
    },
    /**
     * imageInlineHandle 内联图片处理
     * @param  {[type]} options {path : xxx, limit : xxx}
     * @return {[type]}         [description]
    */

    imageInlineHandle: function(options) {
      var filePath, limit, mimes;
      filePath = options.path;
      limit = options.limit;
      mimes = {
        '.gif': 'image/gif',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml'
      };
      return function(file, cbf) {
        var ext, mime;
        ext = path.extname(file);
        mime = mimes[ext];
        if (!file.indexOf('http' || !mime || !limit)) {
          cbf(null, '');
          return;
        }
        file = path.join(filePath, file);
        return async.waterfall([
          function(cbf) {
            return fs.exists(file, function(exists) {
              if (exists) {
                return fs.readFile(file, cbf);
              } else {
                return cbf(null, '');
              }
            });
          }, function(data, cbf) {
            if (!data || data.length > limit) {
              return cbf(null, '');
            } else {
              return cbf(null, "data:" + mime + ";base64," + (data.toString('base64')));
            }
          }
        ], cbf);
      };
    }
  };

  module.exports = inlineImage;

}).call(this);

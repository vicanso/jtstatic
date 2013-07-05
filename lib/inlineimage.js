(function() {
  var async, config, fs, inlineImage, path, _;

  _ = require('underscore');

  path = require('path');

  fs = require('fs');

  async = require('async');

  config = require('./config');

  inlineImage = {
    /**
     * url css中的URL处理
     * @param  {[type]} data     [description]
     * @param  {[type]} file     [description]
     * @param  {[type]} saveFile [description]
     * @param  {[type]} cbf      [description]
     * @return {[type]}          [description]
    */

    url: function(data, file, saveFile, cbf) {
      var cssData, imageInlineHandle, imagesPath, reg, result, startIndex;
      if (_.isFunction(saveFile)) {
        cbf = saveFile;
        saveFile = '';
      }
      if (saveFile) {
        imagesPath = path.relative(path.dirname(saveFile), path.dirname(file));
      }
      imageInlineHandle = this.imageInlineHandle({
        path: path.dirname(file)
      });
      reg = /background(-image)?\s*?:[\s\S]*?url\(([\s\S]*?)\)[\s\S]*?;/g;
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
                cssData.push("*" + css);
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
      limit = options.limit || config.inlineImageSizeLimit;
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
        if (!config.inlineImage || !file.indexOf('http' || !mime)) {
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


/**!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
*/


(function() {
  var async, config, crypto, fileMerger, fs, jsIsNotMin, mkdirp, parser, path, stylus, uglifyJS, _;

  _ = require('underscore');

  path = require('path');

  fs = require('fs');

  mkdirp = require('mkdirp');

  config = require('./config');

  async = require('async');

  parser = require('./parser');

  crypto = require('crypto');

  stylus = require('stylus');

  uglifyJS = require('uglify-js');

  fileMerger = {
    /**
     * getDefineMergeList 获取已定义合并的文件（如果不是已定义合并的文件，返回null）
     * @param  {[type]} file [description]
     * @return {[type]}      [description]
    */

    getDefineMergeList: function(file) {
      var mergeList, result;
      mergeList = config.mergeList;
      result = null;
      if (mergeList) {
        result = _.find(mergeList, function(item) {
          return ~_.indexOf(item, file);
        });
      }
      return result;
    },
    /**
     * urlHandle css中的URL处理
     * @param  {[type]} data     [description]
     * @param  {[type]} file     [description]
     * @param  {[type]} saveFile [description]
     * @param  {[type]} cbf      [description]
     * @return {[type]}          [description]
    */

    urlHandle: function(data, file, saveFile, cbf) {
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
      reg = /background(-image)?\s*:[\s\S]*? url\(\"?\'?([\S]*?)\'?\"?\)[\s\S]*?;/g;
      cssData = [];
      result = null;
      startIndex = 0;
      return async.whilst(function() {
        return (result = reg.exec(data)) !== null;
      }, function(cbf) {
        var css, imgUrl;
        css = result[0];
        imgUrl = result[2];
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
              newCss = css.replace(imgUrl, newImgUrl);
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
    },
    /**
     * imageInlineHandle 内联图片处理
     * @param  {[type]} options {path : xxx, limit : xxx}
     * @return {[type]}         [description]
    */

    imageInlineHandle: function(options) {
      var filePath, limit, mimes;
      filePath = options.path;
      limit = options.limit || 10 * 1024;
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
    },
    /**
     * mergeFiles 合并文件
     * @param  {Array} files 需要合并的文件列表
     * @param  {String} saveFile 保存的文件
     * @param  {Function} cbf 完成时的call back
     * @return {jtUtil}             [description]
    */

    mergeFiles: function(files, saveFile, cbf) {
      var fileHandleList, results,
        _this = this;
      if (cbf == null) {
        cbf = noop;
      }
      results = [];
      fileHandleList = _.map(files, function(file) {
        return function(cbf) {
          var ext;
          ext = path.extname(file);
          return async.waterfall([
            function(cbf) {
              return fs.readFile(file, 'utf8', cbf);
            }, function(data, cbf) {
              if (~_.indexOf(parser.getParseExts(), ext)) {
                return parser.parse(file, data, function(err, data) {
                  if (err) {
                    return cbf(err);
                  } else {
                    return cbf(null, "/*" + file + "*/" + data);
                  }
                });
              } else if (jsIsNotMin(file)) {
                return cbf(null, "/*" + file + "*/" + (uglifyJS.minify(data, {
                  fromString: true
                }).code));
              } else {
                return cbf(null, "/*" + file + "*/" + data);
              }
            }, function(data, cbf) {
              if (ext === '.less' || ext === '.css' || ext === '.styl') {
                return _this.urlHandle(data, file, saveFile, cbf);
              } else {
                return cbf(null, data);
              }
            }
          ], cbf);
        };
      });
      async.series(fileHandleList, function(err, results) {
        if (err) {
          return cbf(err);
        } else {
          return async.series([
            function(cbf) {
              return mkdirp(path.dirname(saveFile), cbf);
            }, function(cbf) {
              return fs.writeFile(saveFile, _.compact(results).join('\n'), cbf);
            }
          ], cbf);
        }
      });
      return this;
    },
    /**
     * mergeFilesToTemp 将文件合并到临时文件夹，合并的文件根据所有文件的文件名通过sha1生成，返回该文件名
     * @param  {Array} mergeFiles 合并文件列表
     * @param  {String} type 文件类型（用于作为文件后缀）
     * @return {String}            合并后的文件名
    */

    mergeFilesToTemp: function(mergeFiles, type) {
      var getFileHash, linkFileHash, linkFileName, saveFile,
        _this = this;
      _.each(mergeFiles, function(file, i) {
        return mergeFiles[i] = path.join(config.path, file);
      });
      getFileHash = function(arr) {
        var hashList;
        hashList = _.map(arr, function(file) {
          return path.basename(file);
        });
        hashList.push(crypto.createHash('sha1').update(arr.join('')).digest('hex'));
        return hashList.join('_');
      };
      linkFileHash = getFileHash(mergeFiles);
      linkFileName = "" + linkFileHash + "." + type;
      saveFile = path.join(config.mergePath, linkFileName);
      fs.exists(saveFile, function(exists) {
        if (!exists) {
          return _this.mergeFiles(mergeFiles, saveFile, function(err) {
            if (err) {
              return console.error(err);
            }
          });
        }
      });
      return linkFileName;
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

  module.exports = fileMerger;

}).call(this);

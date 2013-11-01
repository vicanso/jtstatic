/**!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
*/


(function() {
  var async, crypto, fileMerger, fs, inlineImage, mkdirp, parser, path, _;

  _ = require('underscore');

  path = require('path');

  fs = require('fs');

  mkdirp = require('mkdirp');

  async = require('async');

  parser = require('./parser');

  crypto = require('crypto');

  inlineImage = require('./inlineimage');

  fileMerger = {
    convertPath: function(data, file, saveFile, cbf) {
      var cssData, currentFilePath, reg, result, saveFilePath, startIndex;
      currentFilePath = path.dirname(file);
      saveFilePath = path.dirname(saveFile);
      reg = /url\(([\s\S]*?)\)/g;
      cssData = [];
      result = null;
      startIndex = 0;
      console.dir(file);
      return async.whilst(function() {
        return (result = reg.exec(data)) !== null;
      }, function(cbf) {
        var css, firstChar, imgFile, imgUrl;
        css = result[0];
        cssData.push(data.substring(startIndex, result.index));
        startIndex = result.index;
        if (!~css.indexOf('base64,')) {
          imgUrl = result[1];
          firstChar = imgUrl.charAt(0);
          if (firstChar === '"' || firstChar === "'") {
            imgUrl = imgUrl.substring(1, imgUrl.length - 1);
          }
          imgFile = path.join(currentFilePath, imgUrl);
          imgUrl = path.relative(saveFilePath, imgFile);
          cssData.push('url("' + imgUrl + '")');
          startIndex += css.length;
        }
        return cbf(null);
      }, function(err) {
        cssData.push(data.substring(startIndex));
        return cbf(err, cssData.join(''));
      });
    },
    /**
     * getDefineMergeList 获取已定义合并的文件（如果不是已定义合并的文件，返回null）
     * @param  {[type]} file [description]
     * @return {[type]}      [description]
    */

    getDefineMergeList: function(file, mergeList) {
      var result;
      result = null;
      if (mergeList) {
        result = _.find(mergeList, function(item) {
          return ~_.indexOf(item, file);
        });
      }
      return _.clone(result);
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
              } else {
                return cbf(null, "/*" + file + "*/" + data);
              }
            }, function(data, cbf) {
              if (ext === '.css') {
                return _this.convertPath(data, file, saveFile, cbf);
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
     * mergeFilesToTemp 将文件合并到临时文件夹，合并的文件根据所有文件的文件名生成，如果文件名过长，使用sha1生成 的字符串，返回该文件名
     * @param  {Array} mergeFiles 合并文件列表
     * @param  {String} type 文件类型（用于作为文件后缀）
     * @param  {String} staticPath 静态文件目录
     * @param  {String} mergePath 合并文件目录
     * @return {String}            合并后的文件名
    */

    mergeFilesToTemp: function(mergeFiles, type, staticPath, mergePath) {
      var getFileHash, linkFileHash, linkFileName, saveFile,
        _this = this;
      _.each(mergeFiles, function(file, i) {
        return mergeFiles[i] = path.join(staticPath, file);
      });
      getFileHash = function(arr) {
        var hashList, name;
        hashList = _.map(arr, function(file) {
          return path.basename(file);
        });
        name = hashList.join('-');
        if (name.length < 0x7f) {
          return name;
        } else {
          return crypto.createHash('sha1').update(arr.join('')).digest('hex');
        }
      };
      linkFileHash = getFileHash(mergeFiles);
      linkFileName = "" + linkFileHash + "." + type;
      saveFile = path.join(mergePath, linkFileName);
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

  module.exports.convertPath = fileMerger.convertPath;

  module.exports.getDefineMergeList = fileMerger.getDefineMergeList;

  module.exports.mergeFiles = fileMerger.mergeFiles;

  module.exports.mergeFilesToTemp = fileMerger.mergeFilesToTemp;

}).call(this);

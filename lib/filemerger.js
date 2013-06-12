
/**!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
*/


(function() {
  var async, config, crypto, fileMerger, fs, mkdirp, parser, path, _;

  _ = require('underscore');

  path = require('path');

  fs = require('fs');

  mkdirp = require('mkdirp');

  config = require('./config');

  crypto = require('crypto');

  async = require('async');

  parser = require('./parser');

  fileMerger = {
    /**
     * getMergeFile 根据当前文件返回合并对应的文件名，若该文件未被合并，则返回空字符串
     * @param  {String} file 当前文件
     * @param  {String} type 文件类型（css, js）
     * @return {String} 返回合并后的文件名
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
     * isMergeByOthers 该文件是否是由其它文件合并而来
     * @param  {String}  file 文件名
     * @return {Boolean}      [description]
    */

    /**
     * mergeFilesBeforeRunning 合并文件(在程序运行之前，主要是把一些公共的文件合并成一个，减少HTTP请求)
     * @param  {Boolean} merging 是否真实作读取文件合并的操作（由于有可能有多个worker进程，因此只需要主进程作真正的读取，合并操作，其它的只需要整理合并列表）
     * @param {Array} mergeFiles 合并文件列表
     * @return {[type]}              [description]
    */

    /**
     * mergeFiles 合并文件
     * @param  {Array} files 需要合并的文件列表
     * @param  {String} saveFile 保存的文件
     * @param  {Function} dataConvert 可选参数，需要对数据做的转化，如果不需要转换，该参数作为完成时的call back
     * @param  {Function} cbf 完成时的call back
     * @return {jtUtil}             [description]
    */

    mergeFiles: function(files, saveFile, dataConvert, cbf) {
      var funcs, self;
      if (cbf == null) {
        cbf = noop;
      }
      self = this;
      funcs = [];
      if (arguments.length === 3) {
        cbf = dataConvert;
        dataConvert = null;
      }
      _.each(files, function(file) {
        return funcs.push(function(cbf) {
          var ext, handle;
          handle = function(err, data) {
            if (!err && dataConvert) {
              data = dataConvert(data, file, saveFile);
            }
            return cbf(err, data);
          };
          ext = path.extname(file);
          switch (ext) {
            case '.less':
              handle = _.wrap(handle, function(func, err, data) {
                var options;
                if (err) {
                  return func(err, data);
                } else {
                  options = {
                    paths: [path.dirname(file)],
                    compress: true
                  };
                  return parser.parseLess(data, options, func);
                }
              });
              break;
            case '.styl':
              handle = _.wrap(handle, function(func, err, data) {
                var options;
                if (err) {
                  return func(err, data);
                } else {
                  options = {
                    paths: [path.dirname(file)],
                    filename: file,
                    compress: true
                  };
                  return parser.parseStylus(data, options, func);
                }
              });
              break;
            case '.coffee':
              handle = _.wrap(handle, function(func, err, data) {
                var options;
                if (err) {
                  return func(err, data);
                } else {
                  options = {
                    fromString: true,
                    warnings: true
                  };
                  return parser.parseCoffee(data, options, func);
                }
              });
          }
          return fs.readFile(file, 'utf8', handle);
        });
      });
      async.parallel(funcs, function(err, results) {
        if (err) {
          return cbf(err);
        } else {
          return mkdirp(path.dirname(saveFile), function(err) {
            if (err) {
              return cbf(err);
            } else {
              return fs.writeFile(saveFile, results.join(''), cbf);
            }
          });
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
        return hashList.join('_');
      };
      linkFileHash = getFileHash(mergeFiles);
      linkFileName = "" + linkFileHash + "." + type;
      saveFile = path.join(config.mergePath, linkFileName);
      fs.exists(saveFile, function(exists) {
        if (!exists) {
          return _this.mergeFiles(mergeFiles, saveFile, function(data, file, saveFile) {
            var ext;
            ext = path.extname(file);
            if (ext === '.less' || ext === '.css' || ext === '.styl') {
              data = _this._convertUrl(data, file, saveFile);
            } else if (ext === '.coffee' || ext === '.js') {
              data += ';';
            }
            return "/*" + (path.basename(file)) + "*/" + data + "\n";
          }, function(err) {
            if (err) {
              return console.error(err);
            }
          });
        }
      });
      return linkFileName;
    },
    _convertUrl: function(data, file, saveFile) {
      var imagesPath, reg, urlList;
      imagesPath = path.relative(path.dirname(saveFile), path.dirname(file));
      reg = /url\(\"?\'?([\S]*?)\'?\"?\)/g;
      urlList = data.match(reg);
      reg = /url\(\"?\'?([\S]*?)\'?\"?\)/;
      _.each(urlList, function(url) {
        var result, resultUrl;
        result = reg.exec(url);
        if (result && result[1]) {
          result = result[1];
          if (result.indexOf('data:')) {
            resultUrl = path.join(imagesPath, result).replace(/\\/g, '\/');
            resultUrl = url.replace(result, resultUrl);
            if (url !== resultUrl) {
              return data = data.replace(url, resultUrl);
            }
          }
        }
      });
      return data.replace(/\n/g, '');
    }
  };

  module.exports = fileMerger;

}).call(this);

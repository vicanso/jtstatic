
/**!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
*/


(function() {
  var FileImporter, config, fileMerger, fs, path, _;

  _ = require('underscore');

  path = require('path');

  fs = require('fs');

  config = require('./config');

  fileMerger = require('./filemerger');

  FileImporter = (function() {
    /**
     * constructor 文件引入类
     * @param  {Boolean} debug 是否debug模式，debug模式下将.min.js替换为.js
     * @param  {String} host 静态文件的host
     * @return {FileImporter}       [description]
    */

    function FileImporter(debug, host) {
      this.host = host;
      this.cssFiles = [];
      this.jsFiles = [];
      this.debug = debug || false;
    }

    /**
     * importCss 引入css文件
     * @param  {String} path     css路径
     * @param  {Boolean} {optioanl} prepend 是否插入到数组最前（在HTML中首先输出）
     * @return {FileImporter}         [description]
    */


    FileImporter.prototype.importCss = function(path, prepend) {
      var self;
      self = this;
      self.importFiles(path, 'css', prepend);
      return self;
    };

    /**
     * importJs 引入js文件
     * @param  {String} path    js路径
     * @param  {Boolean} {optioanl} prepend [是否插入到数组最前（在HTML中首先输出）]
     * @return {FileImporter}         [description]
    */


    FileImporter.prototype.importJs = function(path, prepend) {
      var self;
      self = this;
      self.importFiles(path, 'js', prepend);
      return self;
    };

    /**
     * importFiles 引入文件
     * @param  {String} path    文件路径
     * @param  {String} type    文件类型(css, js)
     * @param  {Boolean} {optioanl} prepend 是否插入到数组最前（在HTML中首先输出）
     * @return {FileImporter}         [description]
    */


    FileImporter.prototype.importFiles = function(path, type, prepend) {
      var self;
      self = this;
      if (_.isString(path)) {
        path = path.trim();
        if (path.charAt(0) !== '/' && path.indexOf('http') !== 0) {
          path = '/' + path;
        }
        if (type === 'css') {
          if (!~_.indexOf(self.cssFiles, path)) {
            if (prepend) {
              self.cssFiles.unshift(path);
            } else {
              self.cssFiles.push(path);
            }
          }
        } else if (!~_.indexOf(self.jsFiles, path)) {
          if (prepend) {
            self.jsFiles.unshift(path);
          } else {
            self.jsFiles.push(path);
          }
        }
      } else if (_.isArray(path)) {
        if (prepend) {
          path.reverse();
        }
        _.each(path, function(item) {
          return self.importFiles(item, type, prepend);
        });
      }
      return self;
    };

    /**
     * exportCss 输出CSS标签
     * @param  {Boolean} merge 是否合并css文件
     * @return {String} 返回css标签
    */


    FileImporter.prototype.exportCss = function(merge) {
      var self;
      self = this;
      return this._getExportFilesHTML(self.cssFiles, 'css', self.debug, merge, this.host);
    };

    /**
     * exportJs 输出JS标签
     * @param  {Boolean} merge 是否合并js文件
     * @return {String} 返回js标签
    */


    FileImporter.prototype.exportJs = function(merge) {
      var self;
      self = this;
      return this._getExportFilesHTML(self.jsFiles, 'js', self.debug, merge, this.host);
    };

    /**
     * _getExportFilesHTML 获取引入文件列表对应的HTML
     * @param  {Array} files 引入文件列表
     * @param  {String} type  引入文件类型，现支持css, js
     * @param  {Boolean} debug 是否debug模式
     * @param  {Boolean} merge 是否需要合并文件
     * @param  {String} host 静态文件的host
     * @return {String} 返回html标签内容
    */


    FileImporter.prototype._getExportFilesHTML = function(files, type, debug, merge, host) {
      var htmlArr, mergeFile, otherFiles, resultFiles, self;
      self = this;
      resultFiles = [];
      _.each(files, function(file) {
        var defineMergeList;
        if (!self._isFilter(file)) {
          if (debug && type === 'js') {
            file = file.replace('.min.js', '.js');
          }
          defineMergeList = fileMerger.getDefineMergeList(file);
          if (defineMergeList) {
            return resultFiles.push(defineMergeList);
          } else {
            return resultFiles.push(file);
          }
        } else {
          return resultFiles.push(file);
        }
      });
      resultFiles = _.uniq(_.compact(resultFiles));
      otherFiles = [];
      mergeFile = function(files) {
        var linkFileName, mergeUrlPrefix;
        linkFileName = fileMerger.mergeFilesToTemp(files, type);
        mergeUrlPrefix = config.mergeUrlPrefix;
        if (mergeUrlPrefix) {
          linkFileName = "" + mergeUrlPrefix + "/" + linkFileName;
        }
        return self._getExportHTML(linkFileName, type, host);
      };
      htmlArr = _.map(resultFiles, function(result) {
        if (_.isArray(result)) {
          return mergeFile(result);
        } else if (merge && result.indexOf('http') !== 0) {
          otherFiles.push(result);
          return '';
        } else {
          return self._getExportHTML(result, type, host);
        }
      });
      if (otherFiles.length) {
        htmlArr.push(mergeFile(otherFiles));
      }
      return htmlArr.join('');
    };

    /**
     * _isFilter 判断该文件是否应该过滤的
     * @param  {String}  file 引入文件路径
     * @return {Boolean}      [description]
    */


    FileImporter.prototype._isFilter = function(file) {
      var filterPrefix;
      filterPrefix = 'http';
      if (file.substring(0, filterPrefix.length) === filterPrefix) {
        return true;
      } else {
        return false;
      }
    };

    /**
     * _getExportHTML 返回生成的HTML
     * @param  {String} file   引入的文件
     * @param  {String} type   文件类型
     * @param  {String} host 静态文件的host
     * @return {String} 返回相应的html
    */


    FileImporter.prototype._getExportHTML = function(file, type, host) {
      var html;
      html = '';
      switch (type) {
        case 'js':
          html = this._exportJsHTML(file, host);
          break;
        default:
          html = this._exportCssHTML(file, host);
      }
      return html;
    };

    /**
     * _exportJsHTML 返回引入JS的标签HTML
     * @param  {String} file   引入的文件
     * @return {String} 返回相应的html
    */


    FileImporter.prototype._exportJsHTML = function(file, host) {
      var url;
      url = this._getUrl(file, host);
      return '<script type="text/javascript" src="' + url + '"></script>';
    };

    /**
     * _exportCssHTML 返回引入CSS标签的HTML
     * @param  {String} file   引入的文件
     * @return {String} 返回相应的html
    */


    FileImporter.prototype._exportCssHTML = function(file, host) {
      var url;
      url = this._getUrl(file, host);
      return '<link rel="stylesheet" href="' + url + '" type="text/css" />';
    };

    /**
     * _getUrl 获取引用文件的URL
     * @param  {String} file 文件路径
     * @param  {String, Array} host 文件域名
     * @return {[type]}      [description]
    */


    FileImporter.prototype._getUrl = function(file, host) {
      var index, urlPrefix, version;
      version = config.version;
      urlPrefix = config.urlPrefix;
      if (urlPrefix.charAt(0) !== '/') {
        urlPrefix = '/' + urlPrefix;
      }
      if (file.indexOf('http') !== 0) {
        if (version) {
          file += "?version=" + version;
        }
        if (file.charAt(0) !== '/') {
          file = '/' + file;
        }
        if (urlPrefix) {
          file = "" + urlPrefix + file;
        }
        if (host) {
          if (_.isArray(host)) {
            index = Math.floor(Math.random() * host.length);
            file = host[index] + file;
          } else {
            file = host + file;
          }
        }
      }
      return file;
    };

    return FileImporter;

  })();

  module.exports = FileImporter;

}).call(this);

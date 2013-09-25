/**!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
*/


(function() {
  var FileImporter, fileMerger, fs, isProductionMode, _;

  _ = require('underscore');

  fs = require('fs');

  fileMerger = require('./filemerger');

  isProductionMode = process.env.NODE_ENV === 'production';

  FileImporter = (function() {
    /**
     * constructor 文件引入类
     * @param  {String} hosts 静态文件的hosts
     * @return {FileImporter}       [description]
    */

    function FileImporter(host, options) {
      this.host = host;
      this.options = options != null ? options : {};
      this.cssFiles = [];
      this.jsFiles = [];
      if (this.hosts == null) {
        this.hosts = this.options.hosts;
      }
      if (this.hosts) {
        if (!_.isArray(this.hosts)) {
          this.hosts = [this.hosts];
        }
        this.hosts = _.map(this.hosts, function(host) {
          if ('http' !== host.substring(0, 4)) {
            return host = "http://" + host;
          } else {
            return host;
          }
        });
      }
    }

    /**
     * importCss 引入css文件
     * @param  {String} file     css路径
     * @param  {Boolean} {optioanl} prepend 是否插入到数组最前（在HTML中首先输出）
     * @return {FileImporter}         [description]
    */


    FileImporter.prototype.importCss = function(file, prepend) {
      this.importFiles(file, 'css', prepend);
      return this;
    };

    /**
     * importJs 引入js文件
     * @param  {String} file    js路径
     * @param  {Boolean} {optioanl} prepend [是否插入到数组最前（在HTML中首先输出）]
     * @return {FileImporter}         [description]
    */


    FileImporter.prototype.importJs = function(file, prepend) {
      this.importFiles(file, 'js', prepend);
      return this;
    };

    /**
     * importFiles 引入文件
     * @param  {String} file    文件路径
     * @param  {String} type    文件类型(css, js)
     * @param  {Boolean} {optioanl} prepend 是否插入到数组最前（在HTML中首先输出）
     * @return {FileImporter}         [description]
    */


    FileImporter.prototype.importFiles = function(file, type, prepend) {
      var cssFiles, jsFiles,
        _this = this;
      cssFiles = this.cssFiles;
      jsFiles = this.jsFiles;
      if (_.isString(file)) {
        file = file.trim();
        if (file.charAt(0) !== '/' && !this._isFilter(file)) {
          file = '/' + file;
        }
        if (type === 'css') {
          if (!~_.indexOf(cssFiles, file)) {
            if (prepend) {
              cssFiles.unshift(file);
            } else {
              cssFiles.push(file);
            }
          }
        } else if (!~_.indexOf(jsFiles, file)) {
          if (prepend) {
            jsFiles.unshift(file);
          } else {
            jsFiles.push(file);
          }
        }
      } else if (_.isArray(file)) {
        if (prepend) {
          file.reverse();
        }
        _.each(file, function(item) {
          return _this.importFiles(item, type, prepend);
        });
      }
      return this;
    };

    /**
     * exportCss 输出CSS标签
     * @param  {Boolean} merge 是否合并css文件
     * @return {String} 返回css标签
    */


    FileImporter.prototype.exportCss = function(merge) {
      return this._getExportFilesHTML(this.cssFiles, 'css', merge);
    };

    /**
     * exportJs 输出JS标签
     * @param  {Boolean} merge 是否合并js文件
     * @return {String} 返回js标签
    */


    FileImporter.prototype.exportJs = function(merge) {
      return this._getExportFilesHTML(this.jsFiles, 'js', merge);
    };

    /**
     * _getExportFilesHTML 获取引入文件列表对应的HTML
     * @param  {Array} files 引入文件列表
     * @param  {String} type  引入文件类型，现支持css, js
     * @param  {Boolean} merge 是否需要合并文件
     * @return {String} 返回html标签内容
    */


    FileImporter.prototype._getExportFilesHTML = function(files, type, merge) {
      var hosts, htmlArr, mergeFile, otherFiles, resultFiles,
        _this = this;
      hosts = this.hosts;
      resultFiles = [];
      _.each(files, function(file) {
        var defineMergeList;
        if (!_this._isFilter(file)) {
          file = _this._convertExt(file);
          defineMergeList = fileMerger.getDefineMergeList(file, _this.options.mergeList);
          if (defineMergeList && isProductionMode) {
            return resultFiles.push(defineMergeList);
          } else {
            return resultFiles.push(file);
          }
        } else {
          return resultFiles.push(file);
        }
      });
      resultFiles = _.uniq(_.compact(resultFiles));
      mergeFile = function(files) {
        var limit, linkFileName, mergeUrlPrefix;
        limit = null;
        if (_this.options.inlineImage) {
          limit = _this.options.inlineImageSizeLimit;
        }
        linkFileName = fileMerger.mergeFilesToTemp(files, type, _this.options.path, _this.options.mergePath, limit);
        mergeUrlPrefix = _this.options.mergeUrlPrefix;
        if (mergeUrlPrefix) {
          linkFileName = "" + mergeUrlPrefix + "/" + linkFileName;
        }
        return _this._getExportHTML(linkFileName, type);
      };
      otherFiles = [];
      htmlArr = _.map(resultFiles, function(result) {
        if (_.isArray(result)) {
          return mergeFile(result);
        } else if (merge && !_this._isFilter(result)) {
          otherFiles.push(result);
          return '';
        } else {
          return _this._getExportHTML(result, type);
        }
      });
      if (otherFiles.length) {
        htmlArr.push(mergeFile(otherFiles));
      }
      if (this.options.exportToArray && type === 'js') {
        return '<script type="text/javascript">var JT_JS_FILES =' + JSON.stringify(htmlArr) + ';</script>';
      } else {
        return htmlArr.join('');
      }
    };

    /**
     * _isFilter 判断该文件是否应该过滤的
     * @param  {String}  file 引入文件路径
     * @return {Boolean}      [description]
    */


    FileImporter.prototype._isFilter = function(file) {
      if (file.substring(0, 7) === 'http://' || file.substring(0, 8) === 'https://') {
        return true;
      } else {
        return false;
      }
    };

    /**
     * _getExportHTML 返回生成的HTML
     * @param  {String} file   引入的文件
     * @param  {String} type   文件类型
     * @return {String} 返回相应的html
    */


    FileImporter.prototype._getExportHTML = function(file, type) {
      var html;
      html = '';
      switch (type) {
        case 'js':
          html = this._exportJsHTML(file);
          break;
        default:
          html = this._exportCssHTML(file);
      }
      return html;
    };

    /**
     * _exportJsHTML 返回引入JS的标签HTML
     * @param  {String} file   引入的文件
     * @return {String} 返回相应的html
    */


    FileImporter.prototype._exportJsHTML = function(file) {
      var url;
      url = this._getUrl(file);
      if (this.options.exportToArray) {
        return url;
      } else {
        return '<script type="text/javascript" src="' + url + '"></script>';
      }
    };

    /**
     * _exportCssHTML 返回引入CSS标签的HTML
     * @param  {String} file   引入的文件
     * @return {String} 返回相应的html
    */


    FileImporter.prototype._exportCssHTML = function(file) {
      var url;
      url = this._getUrl(file);
      return '<link rel="stylesheet" href="' + url + '" type="text/css" />';
    };

    /**
     * _getUrl 获取引用文件的URL
     * @param  {String} file 文件路径
     * @return {[type]}      [description]
    */


    FileImporter.prototype._getUrl = function(file) {
      var host, hosts, index, urlPrefix, version;
      hosts = this.hosts;
      version = this.options.version;
      urlPrefix = this.options.urlPrefix;
      if (urlPrefix.charAt(0) !== '/') {
        urlPrefix = '/' + urlPrefix;
      }
      if (!this._isFilter(file)) {
        if (version) {
          file += "?version=" + version;
        }
        if (file.charAt(0) !== '/') {
          file = '/' + file;
        }
        if (urlPrefix) {
          file = "" + urlPrefix + file;
        }
        if (hosts) {
          index = file.length % hosts.length;
          host = hosts[index];
          if (host) {
            file = host + file;
          }
        }
      }
      return file;
    };

    /**
     * _convertExt 转换文件后缀
     * @param  {[type]} file [description]
     * @return {[type]}      [description]
    */


    FileImporter.prototype._convertExt = function(file) {
      var convertExts, dstExt, srcExt;
      convertExts = FileImporter.convertExts;
      if ((convertExts != null ? convertExts.src : void 0) && convertExts.dst) {
        dstExt = '';
        srcExt = _.find(convertExts.src, function(ext, i) {
          if (ext === file.substring(file.length - ext.length)) {
            dstExt = convertExts.dst[i];
            return true;
          } else {
            return false;
          }
        });
        if (srcExt && dstExt) {
          file = file.substring(0, file.length - srcExt.length) + dstExt;
        }
      }
      return file;
    };

    return FileImporter;

  })();

  module.exports = FileImporter;

}).call(this);

(function() {
  var FileImporter, config, fs, jtStatic, path, staticHandler, _;

  _ = require('underscore');

  FileImporter = require('./lib/fileimporter');

  staticHandler = require('./lib/static');

  config = require('./lib/config');

  fs = require('fs');

  path = require('path');

  jtStatic = {
    FileImporter: FileImporter,
    "static": staticHandler.handler,
    emptyMergePath: function() {
      var mergePath;
      mergePath = config.mergePath;
      return fs.readdir(mergePath, function(err, files) {
        return _.each(files, function(file) {
          return fs.unlink(path.join(mergePath, file), function() {});
        });
      });
    },
    configure: function(key, value) {
      if (_.isObject(key)) {
        return _.extend(config, key);
      } else {
        return config[key] = value;
      }
    }
  };

  module.exports = jtStatic;

}).call(this);

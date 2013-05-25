(function() {
  var config, fs, path, _;

  fs = require('fs');

  path = require('path');

  _ = require('underscore');

  config = {
    path: '',
    urlPrefix: '',
    version: '',
    mergePath: ''
  };

  module.exports = config;

}).call(this);

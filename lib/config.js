(function() {
  var config, fs, path, _;

  fs = require('fs');

  path = require('path');

  _ = require('underscore');

  config = {
    path: '',
    urlPrefix: '',
    version: '',
    mergePath: '',
    mergeList: null,
    inlineImage: false
  };

  config.isProductionMode = process.env.NODE_ENV === 'production';

  module.exports = config;

}).call(this);

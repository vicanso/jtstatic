(function() {
  var Color, JTImage, noop;

  noop = function() {};

  Color = (function() {

    function Color(data) {
      this.data = data;
    }

    Color.prototype.color = function(type, value) {
      var index;
      if (type == null) {
        type = '';
      }
      type = type.toLowerCase();
      index = 0;
      switch (type) {
        case 'r':
          index = 0;
          break;
        case 'g':
          index = 1;
          break;
        case 'b':
          index = 2;
          break;
        case 'a':
          index = 3;
          break;
        default:
          index = 0;
      }
      if (value != null) {
        this.data[index] = value;
        return this;
      } else {
        return this.data[index];
      }
    };

    Color.prototype.getData = function() {
      return this.data;
    };

    return Color;

  })();

  JTImage = (function() {

    function JTImage(data) {
      console.time('LOG');
      this.originData = data;
      this.initColorMap(data.data, data.width, data.height);
      this.similarOffset = 3;
      console.timeEnd('LOG');
    }

    JTImage.prototype.getData = function() {
      var data, i, index, j, originData, _i, _j, _ref, _ref1;
      originData = this.originData;
      data = originData.data;
      index = 3;
      for (i = _i = 0, _ref = this.height; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        for (j = _j = 0, _ref1 = this.width; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; j = 0 <= _ref1 ? ++_j : --_j) {
          if (!this.colorMap[i][j].color('a')) {
            data[index] = 0;
          }
          index += 4;
        }
      }
      return originData;
    };

    JTImage.prototype.removeBackground = function() {
      var i, j, _i, _j, _k, _l, _m, _n, _o, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _results;
      for (i = _i = 0, _ref = this.height; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        for (j = _j = 0, _ref1 = this.width; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; j = 0 <= _ref1 ? ++_j : --_j) {
          this.removeJudge(j, i);
        }
      }
      for (i = _k = _ref2 = this.height - 1; _ref2 <= 0 ? _k <= 0 : _k >= 0; i = _ref2 <= 0 ? ++_k : --_k) {
        for (j = _l = 0, _ref3 = this.width; 0 <= _ref3 ? _l < _ref3 : _l > _ref3; j = 0 <= _ref3 ? ++_l : --_l) {
          this.removeJudge(j, i);
        }
      }
      for (i = _m = 0, _ref4 = this.height; 0 <= _ref4 ? _m < _ref4 : _m > _ref4; i = 0 <= _ref4 ? ++_m : --_m) {
        for (j = _n = _ref5 = this.width - 1; _ref5 <= 0 ? _n <= 0 : _n >= 0; j = _ref5 <= 0 ? ++_n : --_n) {
          this.removeJudge(j, i);
        }
      }
      _results = [];
      for (i = _o = _ref6 = this.height - 1; _ref6 <= 0 ? _o <= 0 : _o >= 0; i = _ref6 <= 0 ? ++_o : --_o) {
        _results.push((function() {
          var _p, _ref7, _results1;
          _results1 = [];
          for (j = _p = _ref7 = this.width - 1; _ref7 <= 0 ? _p <= 0 : _p >= 0; j = _ref7 <= 0 ? ++_p : --_p) {
            _results1.push(this.removeJudge(j, i));
          }
          return _results1;
        }).call(this));
      }
      return _results;
    };

    JTImage.prototype.removeJudge = function(x, y) {
      var color, i, offset, offsets, tmpColor, tmpX, tmpY, _i, _ref, _ref1, _ref2, _results;
      color = (_ref = this.colorMap[y]) != null ? _ref[x] : void 0;
      offsets = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
      _results = [];
      for (i = _i = 0, _ref1 = offsets.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        offset = offsets[i];
        tmpX = x + offset[0];
        tmpY = y + offset[1];
        tmpColor = (_ref2 = this.colorMap[tmpY]) != null ? _ref2[tmpX] : void 0;
        if ((tmpColor != null ? tmpColor.color('a') : void 0) === 0 && this.isSimilar(color, tmpColor)) {
          color.color('a', 0);
          break;
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    JTImage.prototype.isSimilar = function(color1, color2) {
      var bOffset, gOffset, rOffset;
      if (!color1 || !color2) {
        return false;
      } else {
        rOffset = Math.pow(color1.color('r') - color2.color('r'), 2);
        gOffset = Math.pow(color1.color('g') - color2.color('g'), 2);
        bOffset = Math.pow(color1.color('b') - color2.color('b'), 2);
        return this.similarOffset > Math.sqrt(rOffset + gOffset + bOffset);
      }
    };

    JTImage.prototype.initColorMap = function(data, width, height) {
      var color, colorMap, colors, i, index, j, _i, _j;
      data = Array.prototype.slice.call(data);
      index = 0;
      colorMap = [];
      for (i = _i = 0; 0 <= height ? _i < height : _i > height; i = 0 <= height ? ++_i : --_i) {
        colors = [];
        for (j = _j = 0; 0 <= width ? _j < width : _j > width; j = 0 <= width ? ++_j : --_j) {
          color = new Color(data.slice(index, index + 4));
          index += 4;
          if ((i === 0 && j < 10) || j === 0 || (i === height - 1 && j < 10) || j === width - 1) {
            color.color('a', 0);
          }
          colors.push(color);
        }
        colorMap.push(colors);
      }
      this.width = width;
      this.height = height;
      return this.colorMap = colorMap;
    };

    return JTImage;

  })();

  if (typeof exports !== 'undefined') {
    module.exports = JTImage;
  } else {
    this.JTImage = JTImage;
  }

}).call(this);

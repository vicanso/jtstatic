(function() {

  jQuery(function($) {
    var _ref;
    if ((_ref = window.YS) == null) {
      window.YS = {};
    }
    YS.BaseItem = Backbone.Model.extend({
      initialize: function() {}
    });
    return YS.ItemListView = Backbone.View.extend({});
  });

}).call(this);

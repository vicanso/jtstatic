window.YS ?= {}
$ = window.jQuery
YS.BaseItem = Backbone.Model.extend {
  initialize : ->
}

YS.ItemListView = Backbone.View.extend {
  remove : (i) ->
    @model.remove @model.at i
    @render()
    @
  getTemplate : ->
    fields = @fields
    tdHtmlArr = _.map fields, (field) ->
      "<td class='#{field.className}'>#{field.html}</td>"
    _.template "<tr class='item <%= className %>'>#{tdHtmlArr.join('')}</tr>"
  update : ->
    @
  getTableHtml : () ->
    self = @
    getThead = (fields) ->
      thead = '<thead><tr>'
      _.each fields, (field) ->
        thead += "<th class='#{field.className}'>#{field.name}</th>"
      thead += '</tr></thead>'
    getTbody = (items) ->
      getTr = (item) ->
        self.template item
      tbody = '<tbody>'
      _.each items, (item, i) ->
        if i % 2
          item.className = 'odd'
        else
          item.className = 'even'
        tbody += getTr item
      tbody += '</tbody>'

    thead = getThead @fields
    items = @model.toJSON()
    tbody = getTbody items
    "<div class='theadContainer grayGradient'><table>#{thead}</table></div><div class='tbodyContainer'><table>#{tbody}</table></div>"
  async : (data, i) ->
    @model.at(i).set data
    @update()
    @
}
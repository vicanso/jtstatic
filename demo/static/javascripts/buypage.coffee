BuyPage = Backbone.View.extend {
  events :
    'click .save' : 'save'
    'click .saveToTemp' : 'saveToTemp'
    'click .getOrderNo' : 'getOrderNo'
  getData : ->
    $el = @$el
    data =
      type : 'buy'
      id : $el.find('.buyOrderNo span').text()
      depot : @depotSelect.val()
      client : @clientSelect.val()
    data = _.extend data, @buyItemListView.val()
  userLogin : (userInfo) ->
    if userInfo.permissions > 4
      @$el.show()
  getOrderNo : ->
    $el = @$el
    $.get('/orderno?type=jh&cache=false').success (data) ->
      if data.orderNo
        $el.find('.buyOrderNo span').text data.orderNo
  saveToTemp : ->
    @post '/tempsave'
  save : ->
    @post '/save'
  post : (url = '/save') ->
    data = @getData()
    @validate data, (err) ->
      if !err
        $.post(url, data).success (data) ->
          if data.code == 0
            new JT.View.Alert 
              model : new JT.Model.Dialog
                title : '保存成功'
                content : '<p>保存成功，3秒后自动刷新页面！</p>'
                btns : 
                  '直接刷新' : ->
                    window.location.reload()
            _.delay () ->
              window.location.reload()
            , 3000
          else
            new JT.View.Alert
              model : new JT.Model.Dialog
                title : '保存失败'
                content : '<p>保存失败，请重新保存！</p>'
                btns : 
                  '保存' : ->
                    self.save()
                  '取消' : ->

  validate : (data, cbf)->
    errorMsg = []
    if !data.depot
      errorMsg.push '<p class="errorText">进货仓库未选择，请先选择！</p>'
    if !data.client
      errorMsg.push '<p class="errorText">进货客户未选择，请先选择！</p>'
    if !data.inputPriceTotal || Math.abs(data.inputPriceTotal - data.priceTotal) > 10
      errorMsg.push '<p class="errorText">输入金额为0或者与实际金额相差太大，请确认是否有误！</p>'
    if !errorMsg.length
      cbf null
    else
      new JT.View.Alert 
        model : new JT.Model.Dialog
          title : '进货单数据有误'
          content : errorMsg.join ''
          btns : 
            '继续保存' : ->
              cbf null
            '取消保存' : ->
  initialize : ->
    self = @
    $el = @$el
    $(document).on 'userinfo', (e, userInfo) ->
      self.userLogin userInfo
    @selectItemListDialog = new JT.View.Dialog
      el : $el.find('.selectItemsContainer').get 0
      model : new JT.Model.Dialog
        title : '商品选择列表'
        btns : 
          '确定' : () ->
            self.selectItemListView.select()
          '关闭' : () ->

    @buyItemListView = new YS.OrderItemListView {
      el : $el.find('.buyItemsContainer').get 0
      model : new YS.OrderItemList
      showSelectList : (key) ->
        self.selectItemListDialog.open()
        self.selectItemListView.show key.trim(), self.depotSelect.val()
    }
    @selectItemListView = new YS.SelectItemListView {
      el : $el.find('.selectItemsContainer .content').get 0
      model : new YS.SelectItemList
      select : (data) ->
        self.selectItemListDialog.close()
        self.buyItemListView.add data
    }


    @depotSelect = new JT.Collection.Select DEPOTS
    new JT.View.Select {
      el : $el.find '.depot'
      tips : '进货仓库'
      model : @depotSelect
    }

    @clientSelect = new JT.Collection.Select [
        {
          key : '珠海刘'
          name : '珠海刘'
        }
        {
          key : '珠海郑'
          name : '珠海郑'
        }
        {
          key : '珠海谢'
          name : '珠海谢'
        }
      ]
    new JT.View.Select {
      el : $el.find '.client'
      tips : '客户选择'
      model : @clientSelect
    }

    @getOrderNo()
}

jQuery ($) ->
  buyPage = new BuyPage
    el : $('#buyPageContainer').get 0
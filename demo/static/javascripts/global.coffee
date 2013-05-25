window.TIME_LINE.timeEnd 'loadjs'
window.TIME_LINE.time 'execjs'

GLOBAL = Backbone.View.extend {
  events : 
    'click #logoutBtn' : 'logout'
    'userinfo' : 'userLogin'
    'click #loginBtn' : 'login'
  logout : ->
    self = @
    $.get('/logout?cache=false').success () ->
      self.userLoginNotify {permissions : -1}
  userLoginNotify : (userInfo)->
    $(document).trigger 'userinfo', userInfo
  userLogin : (e, userInfo) ->
    loginBtn = $ '#loginBtn'
    logoutBtn = $ '#logoutBtn'
    if userInfo.permissions == -1
      loginBtn.show()
      logoutBtn.hide()
    else
      loginBtn.hide()
      logoutBtn.show()
  postTimeline : ->
    _.defer ->
      data = window.TIME_LINE.getLogs()
      data.type = 'timeline'
      $.post '/statistics', data
  login : ->
    self = @
    async.waterfall [
      (cbf) ->
        if window.CryptoJS
          cbf null, window.CryptoJS
        else
          $.getScript('/statics/common/javascripts/utils/sha1.min.js').success () ->
            cbf null, window.CryptoJS
      (CryptoJS, cbf) ->
        html = '<div class="loginContainer">' +
          '<input type="text" class="name" placeholder="请输入用户名" /><br />' + 
          '<input type="password" class="pwd" placeholder="请输入密码" /><br />' +
          '<p class="errorText infoTip"></p>' +
        '</div>'
        new JT.View.Alert
          model : new JT.Model.Dialog
            title : '用户登录'
            content : html
            btns : 
              '确定' : ($el) ->
                name = $el.find('.name').val()
                pwd = $el.find('.pwd').val()
                cbf null, {
                  name : name
                  pwd : CryptoJS.SHA1(pwd).toString()
                }
              '取消' : ->
                cbf null
      (data, cbf) ->
        if !data
          cbf null
        else
          $.post('/login', data).success (data) ->
            cbf null, data
    ], (err, data) ->
      if data
        if data.code == -1
          new JT.Alert
            title : '用户登录'
            content : '登录出错，是否输入了错误的密码！'
            btns : 
              '确定' : ->
        else
          self.userLoginNotify data.data
  

  getUserInfo : ->
    self = @
    $.get('/userinfo?cache=false').success (data) ->
      self.userLoginNotify data.data
  initialize : ->
    # @postTimeline()
    @getUserInfo()
    # @addUser()
}

LOADING = 
  start : ->
    self = @
    count = 0
    if self.timer
      return
    loadingProgressTip = $('#loadingProgressTip').show()
    self.timer = window.setInterval () ->
      if count < 100
        loadingProgressTip.text "正在加载数据，已完成#{count}%!"
        count += 10
        $('')
    , 250
  end : ->
    self = @
    window.clearInterval self.timer
    self.timer = null
    $('#loadingProgressTip').hide().text ''
  init : ->
    self = @
    $(document).ajaxStart () ->
      self.start()
    $(document).ajaxComplete () ->
      self.end()

jQuery ($) ->
  _ = window._
  async = window.async
  LOADING.init()
  window.TIME_LINE.timeEnd 'all', 'html'
  new GLOBAL {
    el : document
  }
# jtstatic - 主要用于处理HTTP的静态请求，以及引入静态文件

##特性

- 在模板中方便引入JS、CSS文件，自动过滤重复引入的文件。
- 实现JS、CSS文件的自动合并，减少HTTP请求。（可自定义哪些文件合并，页面其它的文件会自动合并）
- 支持stylus、less和coffee-script文件的处理。（可直接引入这些文件，输出到浏览器的时候会自动编译，方便开发中使用）
- 引入的静态的文件可以指定到几个域名中。

##Demo
在demo下面有现成的例子，大家可以运行一下
```js
(function() {
  var app, express, jtStatic;

  jtStatic = require('jtstatic');

  jtStatic.configure({
    // 静态文件目录
    path: "" + __dirname + "/static",
    // 静态文件添加的URL前缀，用于app.use(mountpath, middleware)
    urlPrefix: '/static',
    // 合并文件存放的目录
    mergePath: "" + __dirname + "/static/temp",
    // 合并文件的前缀（用于判断哪些请求是合并出来的文件）
    mergeUrlPrefix: 'temp',
    // 设置静态文件的maxAge单位ms
    maxAge: 300 * 1000,
    // 静态文件URL带的版本号，?version=xxxx，可以不传
    version: Math.floor(Date.now())
  });
  //清空静态文件合并的目录
  jtStatic.emptyMergePath();

  express = require('express');

  app = express();

  app.set('view engine', 'jade');

  app.set('views', './views');

  app.use('/static', jtStatic["static"]());

  app.get('/', function(req, res) {
    var debugMode, fileImporter, hosts;
    debugMode = false;
    hosts = ['http://test1.com', 'http://test2.com'];
    // 用于在模板中引入文件类
    fileImporter = new jtStatic.FileImporter(debugMode);
    return res.render('index', {
      fileImporter: fileImporter,
      title: '测试标题'
    }, function(err, html) {
      var css, js;
      css = fileImporter.exportCss(!debugMode);
      js = fileImporter.exportJs(!debugMode);
      html = html.replace('<!--CSS_FILES_CONTAINER-->', css).replace('<!--JS_FILES_CONTAINER-->', js);
      return res.end(html);
    });
  });

  app.listen(8080);

}).call(this);
```

```jade
!!!5
html(lang='zh-CN')
  head
    meta(http-equiv='Content-Type', content='text/html; charset=UTF-8')
    meta(http-equiv='X-UA-Compatible', content='IE=edge,chrome=1')
    meta(name='keywords', content='javascript,node.js,WEB前端,jQuery,node')
    meta(name='description', content='主要一些介绍node.js和web前端的技术blog，还包括其它一些server的软件')
    meta(name='author',content='小墨鱼 vicanso 腻味 tree')
    title= title
    //CSS_FILES_CONTAINER
    - fileImporter.importCss(['/stylesheets/global.styl', '/stylesheets/index.styl']);
    - fileImporter.importJs(['javascripts/utils/underscore.min.js', 'javascripts/utils/backbone.min.js', '/javascripts/utils/async.min.js']);
  body
    p 测试页面
  - fileImporter.importJs(['/javascripts/buypage.coffee', '/javascripts/global.coffee', '/javascripts/item.coffee']);
  //JS_FILES_CONTAINER
```

##API

- [FileImporter] (#FileImporter)
- [FileImporter.importCss FileImporter.importJs] (#importFile)
- [FileImporter.exportCss FileImporter.exportJs] (#exportFile)

<a name="FileImporter" />
## FileImporter
### 返回引入类的实例，用于在模板中引入静态文件

### 参数列表
- debugMode 是否debug模式，在该模式下，引入的xxx.min.js会替换为引入xxx.js
- hosts 静态文件的host列表，如果不传该参数，使用当前的host（在production使用该参数，为了提升网站加载速度，如果不清楚其原因，google一下就有）

```js
var fileImporter = new jtStatic.FileImporter(false);
```

<a name="importFile" />
## importCss、importJs
### 在模板中引入CSS或JS静态文件

### 参数列表
- files 可以为字符串或数组，需要文件的路径

```js
// jade模板中的调用
- fileImporter.importCss(['/stylesheets/global.styl', '/stylesheets/index.styl']);
- fileImporter.importJs(['javascripts/utils/underscore.min.js', 'javascripts/utils/backbone.min.js', '/javascripts/utils/async.min.js']);
```

<a name="exportFile" />

## exportCss、exportJs
### 将引入的文件输出对应的HTML

### 参数列表
- merge 是否将文件合并输出

```js
  //css文件不作合并
  css = fileImporter.exportCss(false);
  //js文件合并
  js = fileImporter.exportJs(true);
```



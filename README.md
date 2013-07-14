# jtstatic - 主要用于处理HTTP的静态请求，以及引入静态文件

##需求

- 在编写页面的时候，希望将页面分块，模块化（以及其对应的css、js模块化）。
- 在生产环境中，静态文件一般的改动都是比较少的，可以让浏览器缓存较长的时间，那么如果能够在更新的时候，及时通知浏览器更新缓存文件。
- 将功能模块化之后，有可能会产品较多数据量较少的文件，如何处理这些文件。
- 在生产环境中，希望静态文件由其它的域名中加载（甚至多于一个域名中加载）。
- 在生产环境中，希望将一些较小的图片以base64的形式内联到css文件中。
- 在生产环境中，希望将一些较能用的文件合并到一个文件中，减少请求数（这些文件可以动态的增加、减少，在开发环境中不用考虑引入的文件是否常用文件）

## 解决方法

- 添加一个FileImporter类，主要用于引入css、js文件，每个模块只要引入自己需要使用到的文件，而不用考虑是否在其它的模块中已引入（重复引入的静态文件会去重）
- 每次deploy的时候，生成一个version，保证每次deploy之后使用的静态文件都不一样
- 可以自动将页面中使用的js、css合并。
- 自动读取css中的图片url，判断图片的大小，生成相应的base64数据。（由于IE6、7不支持，生成相应的css hack）
- 可以指定一些公共文件合并，这些文件会自动合成另外一个文件


##特性

- 在模板中方便引入JS、CSS文件，自动过滤重复引入的文件。
- 实现JS、CSS文件的自动合并，减少HTTP请求。（可自定义哪些文件合并，页面其它的文件会自动合并）
- 支持stylus、less和coffee-script文件的处理。（可直接引入这些文件，输出到浏览器的时候会自动编译，方便开发中使用）
- 引入的静态的文件可以指定到几个域名中。
- 将css中引入的图片以base64的形式合并到css中。

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
    // 静态文件URL带的版本号，?version=xxxx，可以不传，使用中不要使用Date.now()，因为node有退出重启，很次都会不一次，应该在deploy生成一个version
    version: Math.floor(Date.now() / 1000),
    // 将小图片内联（使用base64的方式）
    inlineImage : true,
    // 固定的合并文件（主要是将一些通用的文件合并）
    mergeList: [['/javascripts/utils/underscore.min.js', '/javascripts/utils/backbone.min.js', '/javascripts/utils/async.min.js']]
  });
  //清空静态文件合并的目录
  jtStatic.emptyMergePath();

  jtStatic.addParser('.sass', 'text/css', function(file, data, cbf) {
    return cbf(null, sass.render(data));
  });

  express = require('express');

  app = express();

  app.set('view engine', 'jade');

  app.set('views', './views');

  app.use('/static', jtStatic["static"]());

  app.get('/', function(req, res) {
    var  fileImporter, hosts;
    hosts = ['http://test1.com', 'http://test2.com'];
    //用于在模板中引入文件
    fileImporter = new jtStatic.FileImporter();
    return res.render('index', {
      fileImporter: fileImporter,
      title: '测试标题'
    }, function(err, html) {
      var css, js;
      css = fileImporter.exportCss(false);
      js = fileImporter.exportJs(false);
      html = html.replace('<!--CSS_FILES_CONTAINER-->', css).replace('<!--JS_FILES_CONTAINER-->', js);
      return res.send(html);
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
- [jtStatic.static] (#static)
- [jtStatic.emptyMergePath] (#emptyMergePath)
- [jtStatic.addParser] (#addParser)
- [jtStatic.convertExts] (#convertExts)
- [jtStatic.url] (#url)
- [jtStatic.FileImporter] (#FileImporter)
- [FileImporter.importCss FileImporter.importJs] (#importFile)
- [FileImporter.exportCss FileImporter.exportJs] (#exportFile)

<a name="static" />
## static
### 返回用于express中的middleware

```js
app.use('/static', jtStatic["static"]());
```

<a name="emptyMergePath" />
## emptyMergePath
### 清空存储合并文件的临时目录

```js
jtStatic.emptyMergePath();
```

<a name="addParser" />
## addParser
### 添加其它类型文件的处理函数

### 参数列表
- ext 文件后缀
- mimeType http的mime类型
- handler 处理的回调函数，参数为[file, data, cbf]

```js
jtStatic.addParser('.sass', 'text/css', function(file, data, cbf) {
  return cbf(null, sass.render(data));
});
```
<a name="convertExts" />
## convertExts
### 添加引入过程中需要转换的文件后缀对

### 参数列表
- convertExts 指定在引入过程中，将哪些文件的后缀转换成其它后缀（主要是为了开发环境中使用非.min版本的js，在production环境中使用.min版本的，当然也可用于在开发环境中使用.styl，在production使用其对应的.css），若不需要转换则不传该值

```js
jtStatic.convertExts({
  src: ['.min.js'],
  dst: ['.js']
});
```

<a name="url" />
## url
### 将css中的引入的图片文件使用base64的方式

### 参数列表
- options {path : 静态文件路径, limit : 文件大小限制}

```js
app.use('/static', jtStatic.url({
  path: __dirname + '/static',
  limit: 100 * 1024
}));
```


<a name="FileImporter" />
## FileImporter
### 返回引入类的实例，用于在模板中引入静态文件

### 参数列表
- hosts 静态文件的host列表，如果不传该参数，使用当前的host（在production使用该参数，为了提升网站加载速度，如果不清楚其原因，google一下就有）

```js
var fileImporter = new jtStatic.FileImporter();
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



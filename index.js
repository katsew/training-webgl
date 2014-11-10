var http = require ('http');
var views = require ('co-views');
var logger = require ('koa-logger');
var route = require ('koa-route');
var serve = require ('koa-static');
var koa = require ('koa');
var app = koa ();

// var options = {
//   default: 'html'
// };

// var render = views (__dirname + '/', options);

// app.use (logger());

// app.use (route.get('/', index));

// function *index (){
//   this.body = yield render ('index');
// }

app.use (serve (__dirname + '/client'));
app.listen (3000);


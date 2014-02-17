#### <span id="server-module">server module</span>
***

Access
<pre>
gracenode.server
</pre>

Configurations
```javascript
"modules": {
	"server": {
		"port": port number,
		"host": host name or IP address,
		"controllerPath": path to controller directory,
		"ignored": ['name of ignored URI'...],
		"error": {
			"404": {
				"controller": controller name,
				"method": public controller method
			},
			"500": ...
		},
		"reroute": [
			{
				"from": '/',
				"to": 'another/place'
			},
			...
		]
	}
}
```

######API: *start*

<pre>
void start()
</pre>
> Starts an HTTP or HTTPS server

#####API: *userError*

<pre>
void userError(mixed error, mixed response, Function callback)
</pre>
> Responds to the client with status code **404**

#####API: *error*

<pre>
void error(mixed error, mixed response, Function callback)
</pre>
> Responds to the client with status code **500**

###### Example:
> Example of how to set up a server
```javascript
// index.js file of an application
var gracenode = require('./GraceNode/');
gracenode.use('server', 'server');
gracenode.setup(function (error) {
	if (error) {
		throw new Error('failed to set up GraceNode');
	}
	// we start the server as soon as GraceNode is ready
	gracenode.server.start();
});
```
> Controller
```javascript
// controller/example/index.js > /example/foo/
var gracenode = require('../GraceNode/');
// this will become part of the URI
// the first argument is **ALWAYS** requestObject
module.exports.foo = function (requestObject, serverCallback) {
	// serverCallback is created by server module automatically
	cb(null. 'foo', 'JSON');
};
// /example/foo/ will display "foo" on your browser
```

> How to read GET and POST
```javascript
// controller file
module.exrpots.index = function (requestObject, cb) {
	// server module automatically gives every controller the following functions:
	// requestObject.getData and requestObject.postData
	var getFoo = requestObject.getData.get('foo');
	var postFoo = requestObject.postData.get('foot');
	cb(null, null, 'JSON');
};
```

> How to read request headers
```javascript
// controller file
module.exports.index = function (requestObject, cb) {
	// server module automatically gives every contrller the following function:
	// requestObject.requestHeaders > an instance of Headers class
	var os = requestObject.requestHeaders.getOs();
};
```

> #### Headers class

>> **get**
<pre>
String get(String headerName)
</pre>

>> **getOs**
<pre>
String getOs()
</pre>

>> **getBrowser**
<pre>
String getBrowser()
</pre>

>> **getDefaultLang**
<pre>
String getDefaultLang
</pre>

> How to set response headers
```javascript
// controller
module.exports.index = function (requestObject, cb) {
	// server module automatically gives every contrller the following function:
	// requestObject.setHeader
	module.exports.setHeader('myHeader', 'foo');
};
```

> How to read and set cookie
```javascript
// controller
module.exports.index = function (requestObject, cb) {
	// server module automatically gives every contrller the following functions:
	// requestObject.getCookie and module.exports.setCookie
	var sessionCookie = requestObject.getCookie('session');
	requestObject.setCookie('myCookie', 'foo');
	// for handling session please use session module
};
```

> How to handle and pass parameters
```javascript
// controller
// request URI /foo/index/one/two/
module.exports.index = function (requestObject, one, two, cb) {
	// one and two are  the values in the request URI
	// by having these parameters and the arguments, these arguments will become requirements
	// missing arguments will cause and error
};
```

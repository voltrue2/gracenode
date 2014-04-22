***
#### <span id="server-module">server module</span>
<a href="#top">Back to the list of built-in modules</a>
***

Access
<pre>
gracenode.server
</pre>

Configurations
```javascript
"modules": {
        "server": {
                "respondOnException": <boolean>
                "protocol": "http" or "https",
                "pemKey": "file path to pem key file" // https only
                "pemCert": "file path to pem cert file" // https only
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

###Respond on Exception mode
If "**respondOnException**" is set to true in the configurations, any uncaught exception in each request will be caught and result in 500 status response.

***

###SSL server
GraceNode has bash scripts to help set up HTTPS server.
<pre>
GraceNode/scripts/sslcertgen.sh //for production
GraceNode/scripts/sslcertgen-dev.sh //for development
</pre>

***

###Events

####requestStart

The event is emitted when a reuqest is received. Passes the request URL.
```
server.on('requestStart', function (requestUrl) {
        // do something
});
```

####requestEnd

The event is emitted when a request has been handled and responded. Passes the reuqest URL.
```
server.on('requestEnd', function (requestUrl) {
        // do something
});
```

***

### start

Example of how to set up a server:

```javascript
// index.js file of an application
var gracenode = require('GraceNode');
gracenode.use('server', 'server');
gracenode.setup(function (error) {
        if (error) {
                throw new Error('failed to set up GraceNode');
        }
        // we start the server as soon as GraceNode is ready
        gracenode.server.start();
});
```

***

### setupRequestHooks

<pre>
void setupRequestHooks(Object hooks)
</pre>

Assign a function to be invoked on every request (each hook callback function is assigned to specific controller method).

Should be used for session validatation etc.

Example:

```javascript
// checkSession will be executed on every request for myController/myPage
gracenode.server.setupRequestHooks({
        myController: {
                myPage: checkSession
        }
});
function checkSession(request, callback) {
        var sessionId = request.getCookie('sessionId');
        gracenode.session.getSession(sessionId, function (error, session) {
                if (error) {
                        return cb(error);
                }
                if (!session) {
                        // no session
                        return cb(new Error('auth error', 403));
                }
                // session found
                cb();
        });
}
// this will apply checkSession function as a request hook to ALL controller and methods
var hooks = checkSession;
// this will apply checkSession function as a request hook to ALL methods of myController
var hooks = {
        myController: checkSession
};
// this will apply checkSession function as a request hook to myPage of myController only
var hooks = {
        myController: {
                myPage: checkSession
        }
};
// set up request hooks
gracenode.server.seupRequestHooks(hooks);
```

***

### Controller
Controller handles all requests to server module.

Example:

```javascript
// controller/example/foo.js > /example/foo/
var gracenode = require('GraceNode');
// this will become part of the URI
// the first argument is **ALWAYS** requestObject
// this will handle requests with "GET" method ONLY
module.exports.GET = function (requestObject, serverResponse) {
        // serverResponse is created by server module per request
        serverResponse.json({ foo: 'foo' });
};
// /example/foo/ will display "foo" on your browser
```

####Translating request URL to controller/method

GraceNode's server module translates request URL to route all requests to correct controllers and methods and pass the rest of request parameters to the controller method as reuqest.parameters [array].

```javascript
// Suppose we have a request like this: GET mydomain.com/myController/myMethod/a/b/c/d
// controller translates this as:
// myController/myMethod.js
module.exports.GET = function (request, response) {
        var params = request.parameters;
        /*
        [
                "a",
                "b",
                "c",
                "d"
        ]
        */
};
```

####Request Method Restrictions

Each controller methods accept and execute specific *declared* request methods ONLY.

Example:

```
// POST /exmaple/boo > exmaple/boo.js
module.exports.POST = function (req, res) {
        // do something
};
```

Above example is the controller method for POST requests (POST /example/boo).

If any other request method than POST is sent, the server will response with and error (status 400).

####Request URL

Request URL can be accessed as shown below.

```javascript
module.exports.GET = function (requestObject, response) {
        var url = requestObject.url;
};
```

####How to read GET, POST, PUT, and DELETE

Request data can be accessed according to the request methods as shown below.

```javascript
// read GET data
module.exports.GET = function (requestObject, response) {
        // server module supports GET, POST, PUT, or DELETE
        var foo = requestObject.data('foo');
        response.json(null);
};
// read POST data
module.exports.POST = function (requestObject, response) {
        // server module supports GET, POST, PUT, or DELETE
        var foo = requestObject.data('foo');
        response.json(null);
};
// read PUT data
module.exports.PUT = function (requestObject, response) {
        // server module supports GET, POST, PUT, or DELETE
        var foo = requestObject.data('foo');
        response.json(null);
};
// read DELETE data
module.exports.DELETE = function (requestObject, response) {
        // server module supports GET, POST, PUT, or DELETE
        var foo = requestObject.data('foo');
        response.json(null);
};
```

#### Request Headers

Request headers are accessed as:

```javascript
// controller file
module.exports.GET = function (requestObject, response) {
        // server module automatically gives every contrller the following function:
        // requestObject.headers > an instance of Headers class
        var os = requestObject.headers.getOs();
};
```


#### Headers class

Headers object holds all request headers and related methods.

> Access:

>  ```javascript
module.exports.GET = function (requestObject, response) {
        var requestHeaders = requestObject.headers;
};
```

> #### headers.get
<pre>
String get(String headerName)
</pre>

> #### headers.getOs
<pre>
String getOs()
</pre>

> #### headers.getClient
<pre>
String getClient()
</pre>

> #### headers.getDefaultLang
<pre>
String getDefaultLang
</pre>

#### Cookies

> This object holds and contains all cookie related data and methods.

> ```javascript
// controller
module.exports.GET = function (requestObject, response) {
        // get
        var foo = requestObject.cookies.get('foo');
        // set
        requestObject.cookies.set('boo', 'boo');
};
```

***

#### Response class

Response class manages all server responses to the client requests.

> #### response headers

> Response headers can be set as shown below.

> ```javascript
// controller
module.exports.GET = function (requestObject, response) {
        // name, value
        response.header('foo', 'foo');
};
```
> #### response.json

> Resonds to the client as JSON.

> Status code is optional and default is 200.
<pre>
Void response.json(Mixed content, Integer status)
</pre>

> #### response.html

> Resonds to the client as HTML.

> Status code is optional and default is 200.
<pre>
Void response.html(String content, Integer status)
</pre>

> #### response.error
> Resonds to the client as an error. content can be JSON, String, Number.
> Status code is optional and default is 404.
<pre>
Void response.error(Mixed content, Integer status)
</pre>


> #### response.redirect

> Redirects the request to another URL.

> ```javascript
// controller
// request URI /foo/index/
module.exports.GET = function (requestObject, response) {
        response.redirect('/anotherPage/');
};
```

> #### response.file (Not recommanded)
> Resonds to the client as a static file.
> Status code is optional and default is 200.
<pre>
Void response.file(Binary content, Integer status)
</pre>

***

#### Congiguring Error Handlers

Server module allows the developer to assigned specific error handling constroller end method based on HTTP response status

Example:

```
// configurations:
{
	"server": {
		"404": {
			"controller": "error",
			"method": "notFound"
		}
	}
}
```

The above example assigns the controller "error" and method "notFound" (controller/error/notFound.js) to status code 404.

When the server response status is 404, the server will then execute error/notFound.js.

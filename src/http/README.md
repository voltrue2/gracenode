# HTTP Router

Router lets you build HTTP server and REST endpoints easily.

## Access

`gracenode.http`

**Deprecated Notice**

`gracenode.router` is now deprecated. Please use `gracenode.http` instead

## Configure Port and Host

`gracenode.http` needs a port number and a host name to start the HTTP server.

```
http: {
	port: <number>,
	host: <string>
}
```

**Deprecated Notice**

Configuration `router` is now deprecated. Please use `http` instead.

```
router: {
	port: <number>,
	host: <string>
}
```

**Example**:

```javascript
var gn = require('gracenode');

gn.config({
	http: {
		port: 8888,
		host: 'localhost'
	}
});

gn.start(function () {
	// HTTP server is ready
});

```

**NOTE**: Once you give `port` and `host`, **gracenode** will automatically start the HTTP server while `gracenode.start()`.

## Register endpoints

You must register endpoint routes in order to setup your REST server with `gracenode.http`.

## GET

```javascript
gracenode.http.get('/example', function (req, res) {
	// respond as JSON
	res.json({ say: 'hello' });
});
```

### Define URL parameters

`gracenode.http` allows you to define parameters in the request URLs.

**Example**:

The example below defines a URL parameter `name`.

```
GET /example/{name}
```

```
GET /example/Kevin
```

The above request URL will be routed to the handler of `GET /example/{name}`.

To access `{name}`:

```
exports.exampleHandler = function (req, res) {
	// Kevin
	var name = req.params.name;
};
```

### Define URL parameters with types

`granode.http` allows you to define typed parameters.

**Valid Types**:

- string

- number

- bool

- object

- regex *NOTE 1

**Syntax**

```
{type:paramName}
```

**Example**:

```
gracenode.http.get('/example/{number:id}/{string:name}');
```

**NOTE 1**: Date type as regular expression

`http` allows you to define the parameter data type as regular expression.

If the given parameter does not match the regular expression, the HTTP router will return with an error.

**Syntax**

```
{<regular expression>:paramName}
```

**Example**

```
{/^[a-zA-Z]*$/g:paramName}
```

## POST, PUT, DELETE, PATCH, and HEAD

To register endpoints for request method other than `GET`, use the following:

```
gracenode.http.post(url [string], handler [function]);

gracenode.http.put(url [string], handler [function]);

gracenode.http.delete(url [string], handler [function]);

gracenode.http.patch(url [string], handler [function]);

gracenode.http.head(url [string], handler [function]);
```

## Read Request Body

`GET` and `HEAD` requests will not read request body by default.

In order to read request body of `GET` or/and `HEAD` add the following option:

```javascript
gracenode.http.get('/read/req/body', getReqHandler, { readBody: true });
```

## req

The handler functions of endpoints will be passed two arguments.

The first argument is `req`. It is an expanded `request` object.

**Properties**:

### req.url

Request URL.

### req.headers

Request headers.

### req.id

Unique ID for each request.

### req.args

Object to hold user data for sharing the data among <a href="https://github.com/voltrue2/gracenode#register-request-hooks">request hooks</a> and handler.

**Example**:

```
// set session ID
req.args.sessionId = 'xxxx';

// you can use the session ID elsewhere
var sessionId = req.args.sessionId;
```

### req.query

Object that holds GET query data.

**Example**:

```
// request URL: GET /example?id=1234
var id = req.query.id;
```

### req.params

Object that holds URL parameters.

**Example**:

Example Request: `GET /example/animal/info/cat`.

```javascript
gracenode.http.get('/example/{category}/info/{name}', function (req, res) {
	// animal
	var category = req.params.category;
	// cat
	var name = req.params.name;
	// do somethinf
});
```

### req.body

Object that holds request body (For POST, PUT, DELETE, and PATCH).

### req.cookies()

Returns a cookie object.

**Example**:

How to set a cookie data

```javascript
gracenode.http.login('/login', function (req, res) {
	// do some loging operations here
	var cookies = req.cookies();
	cookies.set('sessionId', sessionId);
	// respond here
});
```

How to get a cookie data

```javascript
gracenode.http.get('/example', function (req, res) {
	var cookies = req.cookies();
	var sessionId = cookies.get('session');
});
```

## res

Response object tat wraps the HTTP response object of node.js.

### res.headers

Object that holds response headers.

**To Set Response Headers**:

```javascript
gracenode.http.post('/example', function (req, res) {
	// set a custom header
	res.headers.sessionId = 'xxxx';
	// respond
	res.html(htmlData);
});
```

### res.gzip(enable [boolean])

Enable/Disable gzip compression of response data.

By default, the server responds with gzipped data only if requested by request header `Accept-Encoding: gzip`.

**NOTE**: This function will override the request header.

### res.onClose(callback [function])

Executes a given callback function on unexpected connection close such as client timeout etc

### res.json(data [object], status [*number])

Send response as JSON.

The default status is 200.

### res.html(html [string], status [*number])

Send response as HTML.

The default status is 200.

### res.text(text [string], status [*number])

Send response as plain text.

The default status is 200

### res.download(filePath [string], status [*number])

File download response.

The default status is 200.

### res.stream(filePath [string])

Stream file. 

Useful for HTML5 video streaming etc.

### res.file(filePath [string], status [*number])

Server a static file.

### res.error(error [object], [*number])

Send response as error (response data is JSON object).

The default status is 400.

## Register Request Hooks

`gracenode.http` allows you to setup request hook functions for your endpoints.

Useful for session varification etc.

### gracenode.http.hook(url [string], hook [function])

Registered hook functions are executed on every match request.

**Example**:

```javascript
gracenode.http.hook('/', hookForAllRequest);
gracenode.http.hook('/exmaple', hookForExampleRequest);
gracenode.http.hook('/example/one', hookForExampleOneReuqest);

gracenode.http.get('/example', exampleHandler);
gracenode.http.get('/example/one', exampleOneHandler);
```

- `GET /example` will have `hookForAllRequest`, `hookForExampleRequest` as request hooks and they will be executed BEFORE `exmapleHandler`.

- `GET /example/one` will have `hookForAllRequest`, `hookForExampleRequest`, and `hookForExampleOneRequest` as request hooks and they will be executed BEFORE `exampleOneHandler`.

**Hook Function**:

```javascript
function hook(req, res, next) {
	// call next() to move on to next hook or handler
	next();
}
```

Each hook function will have `req`, `res`, and `next` as arguments.

`req` is the expanded request object. 

`res` is the response object.

`next` is the function to move on to next hook or handler.

**NOTE**: You may pass an error to `next()` to response as an error. The default status code is `400`.

To change the status code, pass a second argument like so `next(error, 401)`.

## Create Generic Error Handling

`gracenode.http` can optionally execute an error handler for specific error status such as 404.

This is useful when you need to display uniform 404 page on every 404 response etc.

### gracenode.http.error(status [number], handler [function])

**Example**:

```javascript
gracenode.http.error(404, function (req, res) {
	res.json({ message: 'Not Found'}, 404);
});
```

## Serving Static Files

**gracenode** HTTP router can serve static files such as images etc.

**Example**:

```javascript
var staticFileDirectoryList = [
	'/public/',
];
gracenode.http.static('/static', staticFileDirectoryList);
```

The above example will create routes as:

**NOTE**: `/public/` directory is treated as the document root directory and **IS NOT** present in routed URL.

```
GET /static/{file path}
GET /static/css/{file path}
GET /static/js/moredir/{file path}
// All subdirectories under /public will be routed
```

**Example**:

```javascript
var staticFileDirectoryList = [
	'/public/',
	'/asset/'
];
gracenode.http.static('/static', staticFileDirectoryList);
``` 

The above example will create routes as:

**NOTE**: `/public/` directory is **NOT** treated as the document root directory and **IS** present in routed URL.

When passing more than 1 static file directory paths, **gracenode** HTTP router will be routing static files as shown below:

```
GET /static/public/{file path}
GET /static/public/css/{file path}
GET /static/public/js/moredir/{file path}
GET /static/public/asset/{file path}
GET /static/public/asset/img/{file path}
GET /static/public/asset/video/{file path}
// All subdirectories under /public will be routed
```

**NOTE**: When service static files from your application, you must consider the file I/O load.

Each request will instruct the server to read from a file.

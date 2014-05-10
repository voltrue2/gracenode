# Request Module
***

Access
<pre>
gracenode.request
</pre>

Configurations
N/A

### .GET(url [string], requestParams [object], options [object*], callback [function])

Sends a GET request

#### Options
```
{
	// send extra headers
	headers: <object>,
	// set specific encoding
	encoding: <string>,
	// unzip the response body
	gzip: <boolean>
}
```

Example:

```javascript
gracenode.request.GET('http://xxxx.com/aaa/bbb', { test: 1 }, null, function (error, body, status) {
	// do something
});
```

### .POST(url [string], requestParams [object], options [object*], callback [function])

Sends a POST request

#### Options
```
{
	// send extra headers
	headers: <object>,
	// set specific encoding
	encoding: <string>,
	// unzip the response body
	gzip: <boolean>
}
```

Example:

```javascript
gracenode.request.POST('http://xxxx.com/aaa/bbb', { test: 1 }, null, function (error, body, status) {
	// do something
});
```

### .PUT(url [string], requestParams [object], options [object*], callback [function])

Sends a PUT request

#### Options
```
{
	// send extra headers
	headers: <object>,
	// set specific encoding
	encoding: <string>,
	// unzip the response body
	gzip: <boolean>
}
```

Example:

```javascript
gracenode.request.PUT('http://xxxx.com/aaa/bbb', { test: 1 }, null, function (error, body, status) {
	// do something
});
```

### .DELETE(url [string], requestParams [object], options [object*], callback [function])

Sends a DELETE request

#### Options
```
{
	// send extra headers
	headers: <object>,
	// set specific encoding
	encoding: <string>,
	// unzip the response body
	gzip: <boolean>
}
```

Example:

```javascript
gracenode.request.DELETE('http://xxxx.com/aaa/bbb', { test: 1 }, null, function (error, body, status) {
	// do something
});
```

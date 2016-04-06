# Session

**gracenode** comes with built-in session management for HTTP server, UDP server, and more.

**NOTE**: By default `gracenode.session` uses `node.js` in-memory storage to keep session.

This is for development use only and it should never be used in production.

Example for logging in users with default in-memory storage for HTTP server:

```javascript
var gn = require('gracenode');

// require session
gn.session.useHTTPSession([
	'/mypage',
	'/securepage'
]);

// define a route for login
gn.http.post('/login', function (req, res) {
	// do some authentication here and create session data
	var sessionData = {
		// some session data here
	};
	gn.session.setHTTPSession(req, res, sessionData, function (error) {
		if (error) {
			return res.json(error);
		}
		// all done
		res.json({ message: 'OK' });
	});
});
```

## How to enable HTTP session

### .useHTTPSession(routeList [array])

Applies session validation to the given list of routes.

## How to set a new session for HTTP server

In order to start a new session, you must call the following function:

### .setHTTPSession(request [request object], response [response object], sessionData [mixed], callback [function])

Typically this function is used in the user authentication steps.

Example:

```javascript
var gn = require('gracenode');

// define a route for login
gn.http.post('/login', function (req, res) {
	// do some authentication here and create session data
	var sessionData = {
		// some session data here
	};
	gn.session.setHTTPSession(req, res, sessionData, function (error) {
		if (error) {
			return res.json(error);
		}
		// all done
		res.json({ message: 'OK' });
	});
});
```

## How to access HTTP session data

Each successful HTTP request will have `request.args.session` and `request.args.sessionId`.

Example:

```javascript
gracenode.http.get('/mySecurePage', function (req, res) {
	// my session ID
	var sessionId = req.args.sessionId;
	// my session data
	var session = req.args.session;
	// do something here and respond to the client
});
```

## How to enable UDP session

### .useUDPSession()

Enables UDP server's session and data encryption/decryption.

For more details please read <a href="https://github.com/voltrue2/gracenode/tree/develop/src/udp">HERE</a>.

## Define custom storage for session

`gracenode.session` allows you to define how and where you want to keep your session such as a database.

### .defineSet(handler [function])

Defines a function to "set" and store session data.

The callback `handler` function will have `sessionId`, `sessionData`, and `callback` passed.

**NOTE**: This function will be called whenever we need to set a session.

Example:

```javascript
var gn = require('gracenode');

gn.session.defineSet(function (sessionId, sessionData, cb) {
	// store sessionData into a database here
	database.set(sessionId, sessionData, function (error) {
		if (error) {
			return cb(error);
		}
		// all done!
		cb();
	});
});
```

### .defineGet(handler [function])

Defines a function to "get" session data from the storage of your choice.

The callback `handler` function will have `sessionId` and `callback` passed.

**NOTE**: `gracenode.session` automatically updates session TTL upon successful session "get".

Example:

```javascript
var gn = require('gracenode');

gn.session.defineGet(function (sessionId, cb) {
	// get session data from a database
	database.get(sessionId, function (error, sessionData) {
		if (error) {
			return cb(error);
		}
		// we got session data
		cb(null, sessionData);
	});
});
```

### .defineDel(handler [function])

Defines a function "delete" session data stored.

This function will automatically be called when calling `gracenode.session.delHTTPSession(req, res, callback)`.

The callback `handler` function will have `sessionId` and `callback` passed.

```javascript
var gn = require('gracenode');

gn.session.defineDel(function (sessionId, cb) {
	// delete session data from a database
	database.delete(sessionId, function (error) {
		if (error) {
			return cb(error);
		}
		// all done
		cb();
	});
});
```

## Configuring session management

`gracenode.session` allows you to configure how session should behaive.

### .useCookie(use [*bool])

If set `true`, `gracenode.session` will use `cookies`.

Default is `true`.

**NOTE:** If this is set to `false`, it will use `request` and `response` headers or request query to pass session ID around.

The session ID key name is always `sessionid`.

The header name is `sessionid`.

### .oneTimeSessionId(use [*bool])

If this is set `true`, `gracenode.session` will change session ID on every request responded.

Default is `false`.

**NOTE**: This is only available for `.useCookie(false)`.

### .sessionDuration(duration [number])

Allows you to set session duration in milliseconds.

Default is 1 hour.

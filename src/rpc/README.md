# RPC Server

**gracenode** offers RPC server over raw TCP for real-time bidirectional applications.

RPC server can optionally use built-in session/encryption for secure data transmission.

**STABILITY**: This feature is still unstable and subjected to changes in the future.

## Access

`gracenode.rpc`

## Configurations

```
rpc: {
	host: [host name],
	portRange: [ [port to start from], [port to end with] ]
}
```

## How to start RPC server

When you provide the above configurations and call `gracenode.start()`, RPC server will automatically start.

## Commands

**gracenode** RPC server handles incoming packets with `commands`.

Commands are pre-defined handler functions that process incoming TCP packets.

In order to utilize commands, the TCP packet sent from the client must meet the following structrue:

### Request Packet Structure

|Byte Position|Size              |Meaning              |
|:-----------:|:----------------:|:-------------------:|
|0 Byte       |uint 8            |**Protocol Version** |
|0 Byte       |uint 32 Big Endian|Payload Size         |
|4 Byte       |uint 16 Big Endian|Command ID           |
|6 Byte       |uint 16 Big Endian|Sequence             |
|8 Byte       |uint 32 Big Endian|Timestamp in seconds |
|12 Byte      |                  |Payload              |
|             |uint 32 Big Endian|**Magic Stop Symbol**|

**Protocol version**:

|Value|Type             |Commant     |
|:---:|:---------------:|:----------:|
|0    |RPC              |            |
|0x50 |Proxy Protocol v1|            |
|0x0d |Proxy Protocol v2|Not Suppoted|

**Max Payload Size**: It is `8000` bytes.

**Magic Stop Symbol**: 

It tells RPC server that this is the end of a command packet.

The value of **Magic Stop Symbol** is `0x5c725c6e`.

### Reply Packet Structure

RPC server can also push packets to client

|Byte Position|Size              |Meaning              |
|:-----------:|:----------------:|:-------------------:|
|0 Byte       |uint 8            |**Protocol Version** |
|0 Byte       |uint 32 Big Endian|Payload Size         |
|4 Byte       |uint 8            |**Reply Flag**       |
|5 Byte       |uint 8            |**Status**           |
|6 Byte       |uint 16 Big Endian|Sequence             |
|8 Byte       |uint 32 Big Endian|Timestamp in seconds |
|12 Byte      |                  |Payload              |
|             |uint 32 Big Endian|**Magic Stop Symbol**|

**Protocol Version**:

The reply and push packets from RPC server will always have  protocol version of `0x0`.

**Reply Flag**:

A flag to indicate that it is a pushed packet from RPC server.

The value is `0x01`.

**Status**

|Value|Meaning      |HTTP Status Equivalent|
|:---:|:-----------:|:--------------------:|
|1    |OK           |200                   |
|2    |Bad Request  |400                   |
|3    |Forbidden    |401                   |
|4    |Not Found    |404                   |
|5    |Server Error |500                   |
|6    |Unavailable  |503                   |
|99   |Unknown      |None                  |

**Magic Stop Symbol**: 

It tells RPC server that this is the end of a command packet.

The value of **Magic Stop Symbol** is `0x5c725c6e`.

### Push Packet Structure

|Byte Position|Size              |Meaning              |
|:-----------:|:----------------:|:-------------------:|
|0 Byte       |uint 8            |**Protocol Version** |
|0 Byte       |uint 32 Big Endian|Payload Size         |
|4 Byte       |uint 8            |**Push Flag**        |
|5 Byte       |uint 8            |**Status**           |
|6 Byte       |uint 16 Big Endian|**Sequence**         |
|8 Byte       |uint 32 Big Endian|Timestamp in seconds |
|12 Byte      |                  |Payload              |
|             |uint 32 Big Endian|**Magic Stop Symbol**|

**Protocol Version**:

The reply and push packets from RPC server will always have  protocol version of `0x0`.

**Push Flag**:

A flag to indicate that it is a pushed packet from RPC server.

The value is `0x0`.

**Status**

Status for pushed packets is always `0`.

**Sequence**

Sequence for push packets is always `0`.

**Protocol Version**:

The reply and push packets from RPC server will always have  protocol version of `0x0`.

**Reply Flag**:

A flag to indicate that it is a pushed packet from RPC server.

The value is `0x01`.

**Magic Stop Symbol**: 

It tells RPC server that this is the end of a command packet.

The value of **Magic Stop Symbol** is `0x5c725c6e`.

## Command ID

Command IDs are registered with `integer` values.

Command IDs **MUST** be within `uint 16 big endian`.

## How to register commands on the server

```javascript
var gn = require('gracenode');
var commandId = 1;
var commandName = 'exampleCommand';
gn.rpc.command(commandId, commandName, function (state, cb) {
	// do something here
	// call "cb" if the server wants to respond to the client
});
```

### state object

Command handler functions will have `state` object and `callback` function passed.

`state` object contains the following:

```
{
	// constants for response status
	STATUS: {
		OK: 1,
		// HTTP 400
		BAD_REQ: 2,
		// HTTP 401
		FORBIDDEN: 3,
		// HTTP 404
		NOT_FOUND: 4,
		// HTTP 500
		ERROR: 5,
		// HTTP 503
		UNAVAILABLE: 6,
		// UNKNOWN
		UNKNOWN: 99
	},
	payload: [payload data],
	// set a key/value for this TCP connection to remember
	set: [function],
	// get key/value that has been "set" by state.set()
	get: [function],
	// send packet to connected client
	send: [function],
	// if session and encryption/decryption is used
	sessionId: [session ID],
	// if session and encryption/decryption is used
	// state.seq MUST be incremented by 1 when the server sends push packet to client
	seq: [seq],
	// if sessin and encryption/decryption is used
	session: [session object]
}
```

### Arguments for callback

```javascript
var gn = require('gracenode');
gn.rpc.command(1, 'command1', function (state, cb) {
	var response = { message: 'Hello' };
	var status = state.STATUS.OK;
	var options = {};
	cb(response, status, options);
});
```

#### callback(response [object], status [*number], options [*object])

**response**: This is the response object sent to the client. If you pass an error object, the response will be sent as an error.

Example:

```javascript
var gn = require('gracenode');

gn.rpc.command(1, 'command1', function (state, cb) {
	// this response withh be sent to the client as an error with status of `5`
	cb(new Error('SomeError'), state.STATUS.ERROR);
});

```

**status**: `status` is a status of the response much like HTTP response status code. By default, non-error response's status is `1` (`state.STATUS.OK`).

Default status for an error response is `4` (`state.STATUS.BAD_REQ`).

**options**: An optional object:

```
{
	// use this to control response status
	status: [response status code],
	// if true, RPC server will disconnect after reply
	closeAfterReply: [bool],
	// if true, RPC server will "kill" the connection after reply
	killAfterReply: [bool]
}
```

### Set Key/Value for the connection

#### state.set(key [string], value [mixed])

`state` can "remember" values for as long as the current connection is open.

```javascript
gn.rpc.command(1, 'commandOne', function (state, cb) {
	// remember this value for later use
	state.set('rememberMe', 1000);
	cb({ message: 'OK' });
});
```

### Get Key/Value for the connection

#### state.get(key [string])

`state` can "read" values that have been "set" by `state.set()` for as long as the current connection is open.

```javascript
gn.rpc.command(2, 'commandTwo', function (state, cb) {
	// read the value that has been set before
	var rememberMe = state.get('rememberMe');
	cb({ message: rememberMe });
});
```

### Send packets to client

#### state.send(data [object])

```javascript
gn.rpc.command(3, 'command3', function (state, cb) {
	// do something here
	// now send some packets other than response
	state.send({ message: 'Hello' });
});
```

## Command Hooks

Just like HTTP seerver, RPC server has hooks to commands.

When a command with hooks are called, all hooks for thatcommand will be executed BEFORE the command handler.

```javascript
var gn = require('gracenode');
var commandId = 1;
var commandName = 'exampleCommand';
gn.rpc.command(commandId, commandName, function (state, cb) {
    cb({ message: 'Hello from RPC server' });
});
gn.udp.hook(commandId, function (state, next) {
    // if there is an error
    if (error) {
      return next(error);
    }
    // or do something and move on
    next();
});
```

**NOTE**: You may pass an array of command IDs instead of a command ID to register multiple command hooks.

```javascript
gn.rpc.hook([1, 2, 3, 4], hookHandler);
```

## Use session and encryption

**gracenode** RPC server can optionally handle session and data encryption/decryption.

The encryption/decryption method used is `aes-ecb`.

In order to enable session and data encryption/decryption, you must have the following before you start **gracenode**:

**NOTE**: In order to use session and encryption/decryption for RPC server, 

you **MUST** have HTTP server with authentication endpoint that uses `gracenode.session.setHTTPSession()` to start session.

```javascript
var gn = require('gracenode');
// tell gracenode to use RPC session + encryption/decryption
gn.session.useRPCSession();
// set up HTTP endpoint to authenticate client BEFORE connecting to RPC server
gn.http.post('/authenticate', function (req, res) {
	// do some authentication here
	// once it is successfully authenticated the client/user, start HTTP session
	session = 'some session data';
	gn.session.setHTTPSession(req, res, session, function (error) {
		if (error) {
			return res.error(error, 401);	
		}
		// respond to the client with authentication cipher for RPC encryption/decryption
		res.json({
			serverAddress: [RPC server for the client to connect to],
			serverPort: [RPC server port for the client to connect to],
			cipherData: req.args.cipher
		});
	});
});
```

**NOTICE**: `req.args.cipher` is automatically set when you call `gracenode.session.useRPCSession()` and `gracenode.session.setHTTPSession()`.

### req.args.cipher

The structure of the object is:

```
{
	cipherKey: [buffer],
	cipherNounce: [buffer],
	macKey: [buffer],
	seq: [integer]
}
```

**NOTE**: Whenever the client sends RPC packet to the server, `seq` must be incremented by 1.

## Encrypted Packet

Encrypted messages that sent from the server must be decrypted using the cipher data you received from HTTP end point when authenticating.

The cipher data is valid for the duration of the session.

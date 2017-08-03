# RPC Server

**gracenode** offers RPC server over raw TCP for real-time bidirectional applications.

RPC server can optionally use built-in session/encryption for secure data transmission.

## Access

`gracenode.rpc`

## Configurations

```
rpc: {
	host: [host name],
	portRange: [ [port to start from], [port to end with] ],
	// or pass one port number instead of portRange, RPC server will bind to incremented port number in cluster mode
	port: [ port number ]
	maxPayloadSize: [optional] // default is 8000 bytes,
	heartbeat: [optional] { timeout: [milliseconds], checkFrequency: [milliseconds] }
}
```

## heartbeat

RPC server can optionally require each connected client to send `heartbeat` packet at certain internval before the connection times out.

This is useful detecting disconnected clients without sending `FIN` packet caused by unexpected network disconnect such as client crash, network problemts etc.

### heartbeat packet

The client must send heartbeat packet with command ID `911` at certain interval that is smaller than `heartbeat.timeout`.

The packet content of heartbeat must use the request packet structure with empty payload.

## How to start RPC server

When you provide the above configurations and call `gracenode.start()`, RPC server will automatically start.

### heartbeat response

RPC server sends response back to each heartbeat. The response packet's payload contains:

```
{
	message: 'heartbeat',
	serverTime: [timestamp in milliseconds]
}
```

## Commands

**gracenode** RPC server handles incoming packets with `commands`.

Commands are pre-defined handler functions that process incoming TCP packets.

In order to utilize commands, the TCP packet sent from the client must meet the following structrue:

### Request Packet Structure With Protocol Version 0

|Offset        |Size              |Meaning              |
|:------------:|:----------------:|:-------------------:|
|Byte Offset 0 |uint 8            |**Protocol Version** |
|Byte Offset 0 |uint 32 Big Endian|Payload Size         |
|Byte Offset 4 |uint 16 Big Endian|Command ID           |
|Byte Offset 6 |uint 16 Big Endian|**Sequence**         |
|Byte Offset 8 |                  |Payload              |
|              |uint 32 Big Endian|**Magic Stop Symbol**|

### Request Packet Structure With Protocol Version 2

|Offset        |Size              |Meaning              |
|:------------:|:----------------:|:-------------------:|
|Byte Offset 0 |uint 8            |**Protocol Version** |
|Byte Offset 0 |uint 32 Big Endian|Payload Size         |
|Byte Offset 4 |uint 8            |Command Count        |
|Byte Offset 5 |                  |Payload              |
|              |uint 32 Big Endian|**Magic Stop Symbol**|

#### Protocol Version 2 Payload Structure

Payload is a list of commands and their payload

|Offset        |Size              |Meaning              |
|:------------:|:----------------:|:-------------------:|
|Byte Offset 0 |uint 32 Big Endian|Size of payload      |
|Byte Offset 4 |uint 16 Big Endian|Payload command      |
|Byte Offset 6 |uint 16 Big Endian|Payload sequence     |

**Protocol version**:

|Value|Type             |Comment          |
|:---:|:---------------:|:---------------:|
|0x00 |RPC Version 0    |Single Command   |
|0x63 |RPC Version 2    |Multiple Commands|
|0x50 |Proxy Protocol v1|                 |
|0x0d |Proxy Protocol v2|Not Suppoted     |

**Max Payload Size**: It is `8000` bytes (This value is configurable).

**Sequence**: `Sequence` must be incremented by `1` when client sends a command to RPC server.

`Sequence` that is smaller or same value will be rejected by the server.

**Magic Stop Symbol**: 

It tells RPC server that this is the end of a command packet.

The value of **Magic Stop Symbol** is `0x5c725c6e`.

### Reply Packet Structure

RPC server can also push packets to client

|Offset        |Size              |Meaning              |
|:------------:|:----------------:|:-------------------:|
|Byte Offset 0 |uint 8            |**Protocol Version** |
|Byte Offset 0 |uint 32 Big Endian|Payload Size         |
|Byte Offset 4 |uint 8            |**Reply Flag**       |
|Byte Offset 5 |uint 8            |**Status**           |
|Byte Offset 6 |uint 16 Big Endian|Sequence             |
|Byte Offset 8 |                  |Payload              |
|              |uint 32 Big Endian|**Magic Stop Symbol**|

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

**NOTE**: Offset byte position for `magic stop symbol` is dynamic since the size of payload can vary.

### Push Packet Structure

|Offset        |Size              |Meaning              |
|:------------:|:----------------:|:-------------------:|
|Byte Offset 0 |uint 8            |**Protocol Version** |
|Byte Offset 0 |uint 32 Big Endian|Payload Size         |
|Byte Offset 4 |uint 8            |**Push Flag**        |
|Byte Offset 5 |uint 8            |**Status**           |
|Byte Offset 6 |uint 16 Big Endian|**Sequence**         |
|Byte Offset 8 |                  |Payload              |
|              |uint 32 Big Endian|**Magic Stop Symbol**|

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

## Request Packet Examples

Example in C:

```c
struct packet {
	int ver;
	uint16_t cmd;
	uint16_t seq;
	char payload[0];
};

// request packet
struct packet req;
// protocol version 0 is RPC
req.ver = 0;
// payload size
uint32_t plength = strlen(strJSONData);
uint32_t plen = htonl(plength);
// now add payload size
memmove(&(req), &plen, sizeof(plen));
// command ID
req.cmd = htons(commandId);
// sequence
req.seq = htons(seq);
// now add payload
// if you're using encryption, encrypt strJSONData
memmove(&(req.payload[0]), &strJSONData, strlen(strJSONData));
// magic stop symbol
uint32_t stopval = 0x5c725c6e;
uint32_t stop = htonl(stopval);
memmove(&(req.payload[strlen(strJSONData)]), &stop, sizeof(stop));
```

Example in C#:

```c#
int payloadSize;
int uint16Size = 2;
int uint32Size = 4;
int packetSize;
uint cmdId = 1;
uint seq = 100;
byte[] msg;
byte[] packet;

msg = Encoding.UTF8.GetBytes("{ \"message\":\"Hello\"}");

// create gracenode RPC command packet
payloadSize = IPAddress.HostToNetworkOrder(msg.Length);
byte[] payloadSizeBytes = BitConverter.GetBytes(payloadSize);
packetSize = uint32Size + (uint16Size * 2) + msg.Length + uint32Size;
packet = new byte[packetSize];

// RPC protocol version 0
packet[0] = 0x0;

// add payload size at the offset of 0: payload size if utin32 4 bytes
Buffer.BlockCopy(payloadSizeBytes, 0, packet, 0, uint32Size);

// add command ID at the offset of 4: command ID is uint16 2 bytes
byte[] cmd = BitConverter.GetBytes(IPAddress.HostToNetworkOrder((short)cmdId));
Buffer.BlockCopy(cmd, 0, packet, 4, uint16Size);

// add seq at the offset of 6: seq is uint16 2 bytes
byte[] seqBytes = BitConverter.GetBytes(IPAddress.HostToNetworkOrder((short)seq));
Buffer.BlockCopy(seqBytes, 0, packet, 6, uint16Size);

// add payload at the offset of 8
// if you are using encryption, encrypt msg
Buffer.BlockCopy(msg, 0, packet, 8, msg.Length);

// add magic stop symbol: magic stop symbol is uint 32 4 bytes
int stop = IPAddress.HostToNetworkOrder(1550998638);
byte[] stopBytes = BitConverter.GetBytes(stop);
Buffer.BlockCopy(stopBytes, 0, packet, msg.Length + 8, uint32Size);
```

## Requiring Callbacks

By default, RPC server does NOT force each command to send a response, but by calling the following, you may enforce the requirement of callking a callback

on every command execution.

```
// set callback timeout to be 1 second
var callbackTimeout = 1000;
gracenode.rpc.requireCallback(callbackTimeout);
```

## Encryption and Decryption

For RPC command packet, only `payload` is encrypted.

To enable encryption/decryption use:

```javascript
gracenode.session.useRPCEncryption();
```

**Encryption/Decryption Example in C#**:

`client/cs/Crypto.cs`

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

## Register multiple command handlers for the same command ID

You may register more than  one handler to a command.

```javascript
var gn = require('gracenode');
var commandId = 1;
var commandName = 'mycommand';
gn.rpc.command(commandId, commandName, function (state, cb, next) {
	// the first handler
	next();
});
gn.rpc.command(commandId, commandName, function (state, cb, next) {
	// the second handler
	next();
});
gn.rpc.command(commandId, commandName, function (state, cb) {
	// last handler
	cb();
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
	// state.now is updated every time the connection recieves a packet
	now: [timestamp in milliseconds],
	command: [command ID],
	// connection.id is a unique ID for each connection
	connection: [connection object],
	payload: [payload data],
	// set a key/value for this TCP connection to remember
	set: [function],
	// get key/value that has been "set" by state.set()
	get: [function],
	// send packet as a push to connected client
	send: [function],
	// send packet as a response to connected client: same as callback
	respond: [function],
	// force connection close (graceful) from server
	close: [function],
	// force connection kill from server
	kill: [function],
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

### Send packets to client

#### state.send(data [object])

```javascript
gn.rpc.command(3, 'command3', function (state, cb) {
	// do something here
	// now send some packets other than response
	state.send({ message: 'Hello' });
});
```

### Close TCP Connection From Server

#### state.close()

```javascript
gn.rpc.command(3, 'command3', function (state, cb) {
	state.close();
});
```

#### state.kill(error [error])

```javascript
gn.rpc.command(3, 'command3', function (state, cb) {
	state.kill(new Error('SomeError'));
});
```

## Command Hooks

Just like HTTP seerver, RPC server has hooks to commands.

When a command with hooks are called, all hooks for thatcommand will be executed BEFORE the command handler.

**NOTE**: Hooks can be registered by `command names` also.

```javascript
var gn = require('gracenode');
var commandId = 1;
var commandName = 'exampleCommand';
gn.rpc.command(commandId, commandName, function (state, cb) {
    cb({ message: 'Hello from RPC server' });
});
gn.rpc.hook(commandId, function (state, next) {
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

The encryption/decryption uses AES-256-CBC.

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
	cipherNonce: [buffer],
	macKey: [buffer],
	seq: [integer]
}
```

**NOTE**: Whenever the client sends RPC packet to the server, `seq` must be incremented by 1.

## Encrypted Packet

Encrypted messages that sent from the server must be decrypted using the cipher data you received from HTTP end point when authenticating.

The cipher data is valid for the duration of the session.

**NOTE**: All command requests sent from the client using session/encryption must increment `seq` by `1` everytime the request is sent.

## Properties

### .id

Connection ID of the connection object

### .data

Data object  of the connection managed by `state.get()` and `state.set()`.

## Methods

### .command(commandId [number], commandName [string], handler [function])

Call this function to register command handler function.

```javascript
var gn = require('gracenode');
gn.rpc.command(1, 'commandOne', function (state, cb) {
	// do something here and respond
	cb({ message: 'OK' });
});
```

### .hook(commandId [number or array] handler [function])

Call this function to register a command hook handler function.

```javascript
// command hook for command ID 1
var gn = require('gracenode');
gn.rpc.hook(1, function (state, next) {
	next();
});
```

or 

```javascript
// command hook for command ID 1 and 2
var gn = require('gracenode');
gn.rpc.hook([1, 2], function (state, next) {
	next();
});
```

### .getCommandList()

Returns an array of all commands that have been registered by `.command(...)` up until this point.

The command map format:

```javascript
[
 { id: 911, name: 'heartbeat' },
 { id: 100, name: 'myAwesomeCommand' }
]
```

### .setHeartbeatResponseFormat(format [function])

Allows you to register a custom response data format function for heartbeat.

**Example:**

```javascript
gracenode.rpc.setHeartbeatResponseFormat(function () {
	var buf = Buffer.alloc(9);
	buf.write('heartbeat');
	return buf;
});
```

### .onClosed(handler [function])

Call this to register on connection close handler function.

Usueful if you need to broadcast that this connection is gone to other connections in the netwrok etc.

```javascript
var gn = require('gracenode');
gn.rpc.onClosed(function (connectionId, connection) {
	// do something
});
```

### .onKilled(handler [function])

Call this to register on connection kill handler function.

Usueful if you need to broadcast that this connection is gone to other connections in the netwrok etc.

```javascript
var gn = require('gracenode');
gn.rpc.onKilled(function (connectionId, connection) {
	// do something
});
```

### .info()

Returns an object of listening host/IP address, port, and family.

```
var info = gracenode.rpc.info();
console.log(info.host, info.port, family);
```

## Connection Error and Timeout

RPC server detects and calls `.onClosed()` TCP connection error, timeout, and client disconnect.

## C# Test Client

There is a very baisc test client written in C# in `test/rpc/cs/`.

Execute `build.sh` to make a build. `tcp.exe` file will be created and execute the binary: `mono tcp.exe`

**NOTE:** This requires mono installed on your Linux server.

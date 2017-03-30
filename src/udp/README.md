# UDP Server

**gracenode** offers an option to create a UDP server.

The **gracenode** UDP server can optionally use built-in session/encyption to secure all packets sent and received.

**STABILITY**: This feature is still unstable and subjected to changes in the future.

**30/06/2016**: As of version `3.3.0`, the packet protocol is now `binary` not `JSON`.

## Access

`gracenode.udp`

## Configurations

In order to start the UDP server, you will need to provide the following configurations:

```
{
	udp: {
		// maximam number of packets for in/out per second
		packets: 10,
		// change the default max packet size allowed from clients: Default is 8000 (8KB)
		maxPacketSize: 1000,
		// UDP server will attempt to bind between the two port numbers given here
		portRange: [[port to start from], [port to end with]],
		// or pass one port insead. The server will bind to incremented port number in cluster mode
		port: [ port number ],
		// this is optional and by default it binds to 0.0.0.0 to listen to all addresses
		address: [address to bind to]
	}
}
```

### packets

In order to protect the server from bombarded but controlled number of packets coming in.

`UDP` module has "restrictions" in place to controll the number of packets coming in.

`packets: 10` means the server allows up to 10 packets per second from a client.

## IPv6 Support

**gracenode** UDP server can support IPv6 by using `UDP6`.

In order to use `UDP6`, use the following configuration:

```
udp: {
	version: 'IPv6',
	// all IPv6 address
	address: '::0'
}
```

## How to start UDP server

When you provide the above configurations and call `gracenode.start`, UDP server will automatically start.

## UDP Message Packet

UDP server communicates with binary packet. The format is explained below at **Binary Protocol** section.

## Commands

**gracenode** UDP server handles incoming packets with `commands`.

The protocol used for commands is `binary`.

Commands are pre-defined handler functions that process incoming UDP packets.

In order to utilize commands, the UDP message sent from the client must meet the following structure:

As shown above, `command` property is a required field, but the message from the client can contain anything as long as there is `command` proerty with valid command ID.

### Binary Protocol

#### Request Packet Structure With Protocol Version 0

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

#### Reply Packet Structure

UDP server can also push packets as response to command requests.

|Offset        |Size              |Meaning              |
|:------------:|:----------------:|:-------------------:|
|Byte Offset 0 |uint 8            |**Protocol Version** |
|Byte Offset 0 |uint 32 Big Endian|Payload Size         |
|Byte Offset 4 |uint 8            |**Reply Flag**       |
|Byte Offset 5 |uint 8            |**Status**           |
|Byte Offset 6 |uint 16 Big Endian|Sequence             |
|Byte Offset 8 |                  |Payload              |
|              |uint 32 Big Endian|**Magic Stop Symbol**|

**Reply Flag** The value is `0x01`.

**Status** The value of Status can be manually set by the application.

**Status**

|Value |Meaning      |
|:----:|:-----------:|
|1     |OK           |
|2     |Bad Request  |
|3     |Forbidden    |
|4     |Not Found    |
|5     |Server Error |
|6     |Unavailable  |
|99    |Unknown      |

#### Push Packet Structure

|Offset        |Size              |Meaning              |
|:------------:|:----------------:|:-------------------:|
|Byte Offset 0 |uint 8            |**Protocol Version** |
|Byte Offset 0 |uint 32 Big Endian|Payload Size         |
|Byte Offset 4 |uint 8            |**Push Flag**        |
|Byte Offset 5 |uint 8            |**Status**           |
|Byte Offset 6 |uint 16 Big Endian|**Sequence**         |
|Byte Offset 8 |                  |Payload              |
|              |uint 32 Big Endian|**Magic Stop Symbol**|

**Protocol Version**: Currently protocol version is 0.

**Push Flag** The value is `0x0`.

**Status** The value of Status for push packets is always `0x0`.

### Encryption and Decryption

For UDP command packet, it must contain both `session ID` and **encrypted** `payload`.

To enable encryption/decryption use:

```javascript
gracenode.session.useUDPEncryption();
```

**C# Example**

`client/cs/Crypto.cs`

### Connection Infomation

#### .info()

Returns an object of listening host/IP address, port, and family.

```
var info = gracenode.udp.info();
console.log(info.host, info.port, info.family);
```

### Command ID

Command IDs are registered with `integer` values.

**NOTE**: Valid command ID range is `0` to `65536`.

## How to register commands on the server

```javascript
var gn = require('gracenode');
var commandId = 1;
var commandName = 'exampleCommand';
gn.udp.command(commandId, commandName, function (state) {
	// handle UDP message for command ID 1
});
```

## Register multiple handlers for the same command ID

You may also register more than 1 command handler to a command ID.

```javascript
var gn = require('gracenode');
var commandId = 1;
var commandName = 'mycommand';
gn.udp.command(commandId, commandName, function (state, next) {
	// first handler
	next();
});
gn.udp.command(commandId, commandName, function (state, next) {
	// second handler
	next();
});
gn.udp.command(commandId, commandName, function (state, next) {
	// last handler
});
```

### state object

Command handler functions will have `state` object passed.

`state` object contains the following:

```
{
	STATUS: {
		OK: 1,
		BAD_REQ: 2,
		NOT_FOUND: 3,
		FORBIDDEN: 4,
		SERVER_ERR: 5,
		UNAVAILABLE: 6,
		UNKNOWN: 99
	},
	// state.now is updated when a packet is received
	now: [timestamp in milliseconds],
	sessionId: [session ID] or null,
	seq: [command sequence number] or null,
	session: [session data object] or null,
	clientAddress: [client IP address],
	clientPort: [client port],
	payload: [message from client],
	send: [function to send message to client]
}
```

### Send message from server to client

By using `state.send()`, UDP server can send messages to client.

The client must be listening to the same address and port as `state.clientAddress` and `state.clientPort`.

```
var gn = require('gracenode');
var commandId = 1;
var commandName = 'exampleCommand';
gn.udp.command(commandId, commandName, function (state) {
	state.send({ message: 'Hello from UDP server' }, state.STATUS.OK);
});
```

**NOTE:** You may register **multiple** command handlers to the same command ID and name to be executed one after another.

**STATUS:** By passing `STATUS` as the 2nd argument to `.send()`, your message becomes a **reply** message to a command request.

### Command Hooks

Just like HTTP server, UDP server has hooks to commands.

When a command with hooks are called, all hooks for that command will be executed BEFORE the command handler.

**NOTE**: Hooks can be registered by `command names` also.

```javascript
var gn = require('gracenode');
var commandId = 1;
var commandName = 'exampleCommand';
gn.udp.command(commandId, commandName, function (state) {
	state.send({ message: 'Hello from UDP server' });
});
gn.udp.hook(commandId, function (state, next) {
	// do something and move on
	next();
});
```

**NOTE**: You may pass an array of command IDs instead of a command ID to register multiple command hooks.

Example:

```javascript
gn.udp.hook([1, 2, 3, 4], hookHandler);
```

### Use session and encryption

**gracenode** UDP server can optionally handle session and data encryption/decryption.

Encryption/decryption uses AES-256-CBC.

In order to enable session and data encrytion/decryption, you must have the following before you start **gracenode**:

**NOTE**: In order to use session and encryption/decryption for UDP server, you **MUST** have HTTP server with authentication end point that ueses `gracenode.session.setHTTPSession()`.

**NOTE**: All command requests sent from the client using session/encryption must increment `seq` by `1` everytime the request is sent.

```javascript
var gn = require('gracenode');
// tell gracenode to use UDP session + encryption/decryption
gn.session.useUDPSession();
// set up HTTP end point to authenticate client BEFORE connecting to UDP server
gn.http.post('/authenticate', function (req, res) {
	// do some authentication here
	// once it is successfully authenticated the client/user, set HTTP session
	var session = 'some session data here';
	gn.session.setHTTPSession(req, res, sessionData, function (error) {
		if (error) {
			return res.error(error);
		}
		// respond to the client with authentication cipher for UDP encryption/decryption
		res.json({
			serverAddress: [UDP server address for the client to connect to],
			serverPort: [UDP server port for the client to connect to],
			cipherData: req.args.cipher
		});
	});
});
```

**NOTICE**: `req.args.cipher` is automatically set when you call `gracenode.session.useUDPSession()` and `gracenode.session.setHTTPSession()`.

### req.args.cipher

The structure of the object is:

```javascipt
{
	cipherKey: [buffer],
	cipherNonce: [buffer],
	macKey: [buffer],
	seq: [integer]
}
```

**NOTE**: Whenever the client sends UDP message to the server, `seq` must be incremented by 1.

## Encrypted Packet

Encrypted messages that sent from the server must be decrypted using the `cipher` data you received from HTTP end point when authenticating.

The `cipher` data is valid for the duration of the session.

## Error Handling

**gracenode** UDP allows you to register an error handler function.

### .onError(handler [function])

The callback handler function will have `error` object and `rinfo` object passed.

#### rinfo

The object contains `address` which is the address of the client and `port`, the client port number.

Example:

```javascript
var gn = require('gracenode');
gn.config({
	udp: {
		portRanges: [xxx, yyy]
	}
});
gn.udp.onError(function (error, rinfo) {
	// do something about the error
});
```

### Send a UDP message to user-specified client

**gracenode** UDP can send a message to user-specified client(s). The sent messages are formatted as push packet.

#### gracenode.udp.push(message [buffer], address [string], port: [number], callback [*function])

```javascript
gracenode.udp.push(myPushMessage, myClientAddress, myClientPort, funtion (error) {
	// message sent
	if (error) {
		// oh no...
	}
});
```

***

### Send a UDP message multple user-specified clients

#### .gracenode.udp.multipush(message [buffer], list [array], callback [*function]);

##### list

An array of client address and port: `[ { address: "<address>", port: <port> }, {...} ]`

**gracenode** UDP can also send a message to multiple clients effeciently

```javascript
gracenode.udp.multipush(message, list, function (error) {
	if (error) {
		// oops
	}
	// we are done
});
```

***

## C# Test Client

There is a very baisc test client written in C# in `test/udp/cs/`.

Execute `build.sh` to make a build. `udp.exe` file will be created and execute the binary: `mono udp.exe`

**NOTE:** This requires mono installed on your Linux server.


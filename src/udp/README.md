# UDP Server

**gracenode** offers an option to create a UDP server.

The **gracenode** UDP server can optionally use built-in session/encyption to secure all packets sent and received.

**STABILITY**: This feature is still unstable and subjected to changes in the future.

## Access

`gracenode.udp`

## Configurations

In order to start the UDP server, you will need to provide the following configurations:

```
{
	udp: {
		// UDP server will attempt to bind between the two port numbers given here
		portRange: [[port to start from], [port to end with]],
		// this is optional and by default it binds to 0.0.0.0 to listen to all addresses
		address: [address to bind to]
	}
}
```

## How to start UDP server

When you provide the above configurations and call `gracenode.start`, UDP server will automatically start.

## UDP Message Packet

UDP server communicates with `UTF-8` plain text `JSON` messages.

## Commands

**gracenode** UDP server handles incoming packets with `commands`.

Commands are pre-defined handler functions that process incoming UDP packets.

In order to utilize commands, the UDP message sent from the client must meet the following structure:

```
{
	command: [command ID in integer]
}
```

As shown above, `command` property is a required field, but the message from the client can contain anything as long as there is `command` proerty with valid command ID.

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

### state object

Command handler functions will have `state` object passed.

`state` object contains the following:

```
{
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
	state.send({ message: 'Hello from UDP server' });
});
```

### Command Hooks

Just like HTTP server, UDP server has hooks to commands.

When a command with hooks are called, all hooks for that command will be executed BEFORE the command handler.

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

The encryption/decryption method used is `CTR` and the counter is encrypted by `aes-128-ecb`.

<a href="https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation">Reference: Block Cipher Mode of Operation</a>

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

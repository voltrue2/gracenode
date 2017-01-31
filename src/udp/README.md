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

**Encryption/Decryption Example in C#**:

```c#
using System;
using System.Net;
using System.Text;
using System.Threading;
using System.Collections;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Security.Cryptography;

public class Crypto {

        private const int BLOCK_LEN = 16;

        private byte[] _sessionId;
        private byte[] _sharedSecret;
        private byte[] _cipherKey;
        private byte[] _cipherNonce;
        private byte[] _cipherCounter;
        private byte[] _macKey;
        private uint _sequence;
        private ICryptoTransform _cryptoAlgorithm;
        private HMACSHA256 _hashAlgorithm;
        private int _hashLength;

        public Crypto(Guid sessionId, byte[] cipherKey, byte[] cipherNonce, byte[] macKey) {
                if (cipherKey.Length != 16) {
                        throw new System.ArgumentException("Chipher Key must be 16 bytes");
                }

                if (cipherNonce.Length != 8) {
                        throw new System.ArgumentException("Chipher Nonce must be 8 bytes");
                }

                if (macKey.Length != 32) {
                        throw new System.ArgumentException("Mac Key must be 32 bytes");
                }

                _sequence = 0;
                _sessionId = TransposeGuidBytes(sessionId.ToByteArray());
                _cipherKey = cipherKey;
                _cipherNonce = cipherNonce;
                _cipherCounter = new byte[_cipherNonce.Length + sizeof(uint) + sizeof(uint)];
                _macKey = macKey;

                if (_sessionId.Length != 16) {
                        throw new System.ArgumentException("Session ID must be 16 bytes");
                }


                if (_cipherCounter.Length != 16) {
                        throw new System.ArgumentException("Chipher Counter must be 16 bytes");
                }

                // aes-128-ecb
                Aes aes = Aes.Create();
                aes.Mode = CipherMode.ECB;
                aes.Key = _cipherKey;
                _cryptoAlgorithm = aes.CreateEncryptor();

                _hashAlgorithm = new HMACSHA256(_macKey);
                _hashLength = _hashAlgorithm.HashSize / 8;
                _sharedSecret = new byte[_cipherKey.Length + _cipherNonce.Length + _macKey.Length];

                if (_hashLength != 32) {
                        throw new System.ArgumentException("Hash must be 32 bytes");
                }

                if (_sharedSecret.Length != 56) {
                        throw new System.ArgumentException("Shared Secret must be 56 bytes");
                }

                // copy _chipherKey to _sharedSecret
                Buffer.BlockCopy(_cipherKey, 0, _sharedSecret, 0, _cipherKey.Length);
                // copy _cipherNonce to _sharedSecret
                Buffer.BlockCopy(_cipherNonce, 0, _sharedSecret, _cipherKey.Length, cipherNonce.Length);
                // copy _macKey to _sharedSecret
                Buffer.BlockCopy(_macKey, 0, _sharedSecret, _cipherKey.Length + _cipherNonce.Length, _macKey.Length);
                // copy _cipherNonce to _cihperCounter
                Buffer.BlockCopy(_cipherNonce, 0, _cipherCounter, 0, _cipherNonce.Length);
        }

        public byte[] Encrypt(byte[] payload) {
                _sequence++;
                byte[] seqBytes = BitConverter.GetBytes(IPAddress.NetworkToHostOrder((int)_sequence));
                byte[] cipherBytes = new byte[payload.Length];
                byte[] outpacket = new byte[cipherBytes.Length + seqBytes.Length + _hashLength];

                Ctr(_sequence, payload, cipherBytes, 0);

                Buffer.BlockCopy(seqBytes, 0, outpacket, 0, seqBytes.Length);
                Buffer.BlockCopy(cipherBytes, 0, outpacket, seqBytes.Length, cipherBytes.Length);

                byte[] payloadToSign = ByteSlice(outpacket, 0, outpacket.Length - _hashLength);
                byte[] hmac = _hashAlgorithm.ComputeHash(payloadToSign);

                Buffer.BlockCopy(hmac, 0, outpacket, outpacket.Length - _hashLength, _hashLength);

                byte[] epacket = new byte[_sessionId.Length + seqBytes.Length + outpacket.Length];

                Buffer.BlockCopy(_sessionId, 0, epacket, 0, _sessionId.Length);
                Buffer.BlockCopy(seqBytes, 0, epacket, _sessionId.Length, seqBytes.Length);
                Buffer.BlockCopy(outpacket, 0, epacket, _sessionId.Length + seqBytes.Length, outpacket.Length);

                return epacket;
        }

        public byte[] Decrypt(byte[] payload) {
                int seqSize = sizeof(uint);
                byte[] payloadToSign = ByteSlice(payload, 0, payload.Length - _hashLength);
                byte[] serverHmac = ByteSlice(payload, payload.Length - _hashLength, payload.Length);
                byte[] clientHmac = _hashAlgorithm.ComputeHash(payloadToSign);

                if (!ByteEqual(serverHmac, clientHmac)) {
                        throw new System.ArgumentException("Bad Signature");
                }

                byte[] eBytes = ByteSlice(payload, seqSize, payload.Length - serverHmac.Length);
                byte[] dBytes = new byte[eBytes.Length];

                Ctr(_sequence, eBytes, dBytes, 0);

                return dBytes;
        }

        private static byte[] TransposeGuidBytes(byte[] buffIn) {
                byte[] buffOut = new byte[buffIn.Length];
                buffOut[3] = buffIn[0];
                buffOut[2] = buffIn[1];
                buffOut[1] = buffIn[2];
                buffOut[0] = buffIn[3];
                buffOut[5] = buffIn[4];
                buffOut[4] = buffIn[5];
                buffOut[7] = buffIn[6];
                buffOut[6] = buffIn[7];
                buffOut[8] = buffIn[8];
                buffOut[9] = buffIn[9];
                buffOut[10] = buffIn[10];
                buffOut[11] = buffIn[11];
                buffOut[12] = buffIn[12];
                buffOut[13] = buffIn[13];
                buffOut[14] = buffIn[14];
                buffOut[15] = buffIn[15];
                return buffOut;
        }

        private void Ctr(uint seq, byte[] inBytes, byte[] outBytes, int offset) {
                int count = (inBytes.Length + 15) / 16;
                byte[] ctrBytes = new byte[count * 16];
                byte[] seqBytes = BitConverter.GetBytes(IPAddress.HostToNetworkOrder((int)seq));
                Buffer.BlockCopy(seqBytes, 0, _cipherCounter, _cipherNonce.Length, seqBytes.Length);
                for(int b = 0; b < count; b++) {
                        byte[] blkBytes = BitConverter.GetBytes(IPAddress.HostToNetworkOrder(b));
                        Buffer.BlockCopy(blkBytes, 0, _cipherCounter, _cipherNonce.Length + blkBytes.Length, blkBytes.Length);
                        _cryptoAlgorithm.TransformBlock(_cipherCounter, 0, 16, ctrBytes, b * 16);
                }
                for(int i = 0; i < inBytes.Length; i++) {
                        outBytes[offset + i] = (byte)(ctrBytes[i] ^ inBytes[i]);
                }
        }

        private byte[] ByteSlice(byte[] source, int start, int end) {
                byte[] res = new byte[end - start];

                // handles negative end
                if (end < 0) {
                        end = source.Length + end;
                }

                int len = end - start;

                for (int i = 0; i < len; i++) {
                        res[i] = source[i + start];
                }

                return res;
        }

        private bool ByteEqual(byte[] a, byte[] b) {

                if (a.Length != b.Length) {
                        return false;
                }

                int i = 0;
                int alen = a.Length;
                while (i < alen && (a[i] == b[i])) {
                        i++;
                }

                if (i == alen) {
                        return true;
                }

                return false;
        }

}
```

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


# Portal

`gracenode.portal` is the internal mesh network that connects all **gracenode** servers.

With `portal`, you have full control of communications among the servers.

Portal uses either TCP or UDP to communicate, but if it is communicating with a node that is on the same server, it will automatically switch to Unix socket.

**IMPORTANT**:

`portal` requires a **Redis** server to keep track of all **gracenode** servers.

## Configurations

In order to use `portal`, you must provide the minimum configuration as shown below:

```
gracenode.config({
	portal: {
		type: <string>,
		address: <mesh network address>,
		port: <mesh network port>,
		relayLimit: <number>,
		announce: {
			host: '<host of Redis server>',
			port: <port of Redis server>,
			interval: <interval of announce in milliseconds>
		}
	}
});
```

## Advanced Configurations

### type [String]

Defines a server type (name). You will be able to get a list of mesh nodes with the same server type

by `.getNodes(...)`

### address [String]

The internal address to be used as mesh network node communication end point.

### port [Number]

The internal port number of be used as mesh network node communication end point.

### relayLimit [Number]

The maximum cap for the number of mesh network node to be communicated at a time.

Default is `10`.

### interval [Number]

The interval of cached mesh network node data renewal.

The default is 1000ms.

## Methods

### .onAnnounce(callback [Function])

Registers a callback function (synchronous) to be invoked on every announce.

It is useful when you need to update mesh node value on every announce.

Example:

```javascript
gn.portal.onAnnounce(function () {
	gn.portal.setNodeValue('onlineUsers', getNumberOfOnlineUsers());
});
```

The above example will update "onlineUsers" on every announce.

### .onNewNode(callback [Function])

Registers a callback function to be invoked on detecting a new mesh network node.

Example:

```javascript
gn.portal.onNewNode(function (node) {
	/**
	node {
		address,
		port,
		value,
		type
	}
	*/
});
```

### .setNodeValue(key [String], value [String/Number])

Set/Add a key/value as metadata. The values can be read by `.getNodes(...)` or `.getAllNodes()`.

### .getNodes(type [String])

Returns an array of mesh network nodes of the given `type`.

`type` is set by configuration { type: <server type string>, {...} }`.

### .getAllNodes()

Returns an array of all mesh network nodes.

### .nodes.toNodeListBytes(nodeList [Array])

Converts an array of mesh node (`{ address: <string>, port: <number> }`) to bytes.

### .nodes.toNodeList(bytes [Buffer])

Converts bytes to an array of mesh node (`{ address: <string>, port: <number> }`).

### .nodes.addrAndPortBytes(address [String], port [Number])

Converts address and port to bytes.

### .nodes.bytesToAddrAndPort(bytes [Buffer])

Converts bytes to address and port: `{ address: <string>, port: <number> }`

### .emit(protocol [Number], name [String], nodeList [Array], data [Object], callback [Function])

Sends mesh netowrk communication to multiple mesh network nodes.

#### protocol [Number]

Mesh network protocol. The valid values are: `portal.RUDP` or `portal.UDP`.

#### name [String]

The name that has been defined by `.define(...)`.

#### data [Object]

Data object predefined by `define(...)`.

#### nodeList [Array]

Array of other mesh network nodes to send communication to

Structure of `nodeList`:

```
[
	{ address: '127.0.0.1', port: 8000 },
	{ address: '127.0.0.1', port: 8001 }
	{ address: '127.0.0.1', port: 8002 }
	{ address: '127.0.0.1', port: 8003 }
]
```

### .on(name [String], callback [Function])

The listener for `name` pre-defined by `.define(...)`.


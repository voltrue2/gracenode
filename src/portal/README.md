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

### .define(name [String], strcture [Object])

Define the mesh network communication event and its data structure.

Example:

```javascript
gracenode.portal.define('example', {
	value1: gracenode.portal.DATATYPE.UINT8,
	value2: gracenode.portal.DATATYPE.STR,
	value3: gracenode.portal.DATATYPE.BIN,
	value4: gracenode.portal.DATATYPE.STR_ARR
});
```

### .DATATYPE

The hash map of data types used with `gracenode.portal.define(...)`.

#### .DATATYPE.UINT8

UInt8 data type

#### .DATATYPE.INT8

Int8 data type

#### .DATATYPE.UINT16

UInt16 data type

#### .DATATYPE.INT16

Int16 data type

#### .DATATYPE.UINT32

UInt32 data type

#### .DATATYPE.INT32

Int32 data type

#### .DATATYPE.DOUBLE

Double data type

#### .DATATYPE.BIN

Binary data type

#### .DATATYPE.STR

String data type

#### .DATATYPE.BOOL

Boolean data type

#### .DATATYPE.UINT8_ARR

Array of UInt8 data type

#### .DATATYPE.INT8_ARR

Array of Int8 data type

#### .DATATYPE.UINT16_ARR

Array of UInt16 data type

#### .DATATYPE.INT16_ARR

Array of Int16 data type

#### .DATATYPE.UINT32_ARR

Array of UInt32 data type

#### .DATATYPE.INT32_ARR

Array of Int32 data type

#### .DATATYPE.DOUBLE_ARR

Array of Double data type

#### .DATATYPE.BIN_ARR

Array of Binary data type

#### .DATATYPE.STR_ARR

Array of String data type

#### .DATATYPE.BOOL_ARR

Array of Boolean data type

### .emit(protocol [Number], name [String], nodeList [Array], data [Object], callback [Function])

Sends mesh netowrk communication to multiple mesh network nodes.

#### protocol [Number]

Mesh network protocol. The valid values are: `portal.TCP` or `portal.UDP`.

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


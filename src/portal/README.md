# Portal

`gracenode.portal` is the internal mesh network that connects all **gracenode** servers.

With `portal`, you have full control of communications among the servers.

**NOTE**:

`portal` requires a Redis server to keep track of all **gracenode** servers.

## Configurations

In order to use `portal`, you must provide the minimum configuration as shown below:

```
gracenode.config({
	portal: {
		enable: true,
		host: '<host of Redis server>',
		port: <port of Redis server>
	}
});
```

## Advanced Configurations

### address [String]

The internal address to be used as mesh network node communication end point.

### port [Number]

The internal port number of be used as mesh network node communication end point.

### relayLimit [Number]

The maximum cap for the number of mesh network node to be communicated at a time.

Default is `10`.

### compress [Boolean/Number]

If `true`, call mesh network communication packets will be combined into one packet and sent every 250ms.

If number greater than 0 is provided, the interval of combining and sending of mesh network packets will be the given value.

### interval [Number]

The interval of cached mesh network node data renewal.

The default is 1000ms.

## Methods

### .setServerType(type [String])

### .setValue(key [String], value [String/Number])

Set/Add a key/value as metadata. The values can be read by `.getNodes(...)` or `.getAllNodes()`.

### .getNodes(type [String])

Returns an array of mesh network nodes of the given `type`.

`type` is set by calling `gracenode.portal.setServerType(...)`.

### .getAllNodes()

Returns an array of all mesh network nodes.

### .schema(name [String], strcture [Object])

Define the mesh network communication event and its data structure.

Example:

```javascript
gracenode.portal.schema('example', {
	value1: gracenode.portal.DATATYPE.UINT8,
	value2: gracenode.portal.DATATYPE.STR,
	value3: gracenode.portal.DATATYPE.BIN,
	value4: gracenode.portal.DATATYPE.STR_ARR
});
```

### .DATATYPE

The hash map of data types used with `gracenode.portal.schema(...)`.

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

### .send(name [String], data [Object], address [String], port [Number], options [Object], callback [Function])

Sends mesh network communication to another mesh network node.

#### name [String]

The name that has been defined by `.schema(...)`.

#### data [Object]

Data object to be sent via mesh network.

### .relay(name [String], nodeList [Array], data [Object], callback [Function])

Sends mesh netowrk communication to multiple mesh network nodes.

#### name [String]

The name that has been defined by `.schema(...)`.

### nodeList [Array]

Array of other mesh network nodes to send communication to

Structure of `nodeList`:

```
[
	{ key: '127.0.0.1/8000' },
	{ key: '127.0.0.1/8001' },
	{ key: '127.0.0.1/8002' },
	{ key: '127.0.0.1/8003' },
]
```

### .on(name [String], callback [Function])

The listener for `name` that is given.


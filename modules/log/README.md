#gracenode.log

###Access
```javascript
var log = gracenode.log.create('nameToBeDisplayed');
```

###Configurations
```
{
	"modules":
		"log": {
			"bufferSize": <int> // log data buffer size in memory (bytes),
			"bufferFlushInterval": <int> // log data buffer auto flush interval in milliseconds,
			"file": "<log directory path> or false"
			"remote": {
				"host": "<host name or ip address>",
				"port"" "<port>"
			},
			"console": true or false,
			"color": true or false,
			"showHidden": true or false, // show hidden properties of object
			"depth": <integer> // recursive depth of object
			"level": {
				"verbose": <boolean>
				"debug": <boolean>
				"info": <boolean>
				"warning": <boolean>
				"error": <boolean>
				"fatal": <boolean>
			}
		}
}
```

### Buffering

Log module buffers log data in memory before outputting.

The defualt buffer size is 8kb (8129 bytes) and default bufferFlushInterval is 5 seconds (5000 ms).

#### file

If the path to file is set, gracenode will log into files.

Log files are auto-rotated by YYYY/MM/DD.

`"file": "path to log file directory" or false/null`

#### remote

If the desitination host and port are set, gracenode will send log to an external server via UDP (v4).

`"remote": { "host": "xxxx", "port": yyyy } or false/null`

#### console

If set to true, gracenode will send log to stdout stream of node.js process.

`"console": true or false`

#### color

If set to true, gracenode will color log text.

Each log level has different color.

`"color": true or false`

#### showHidden

If set to true, gracenode will log hidden properties of objects.

`"showHidden": true or false`

#### depth

Decides how far log module should recursively display objects.

`"depth": <integer>`

#### level

Log module has 6 log levels. If set to false, gracenode will ignored that level.

Each log level can be configured.

```
"level": {
    "verbose": <boolean>,
    "debug": <boolean>,
    "info": <boolean>,
    "warning": <boolean>,
    "error": <boolean>,
    "fatal": <boolean>
}
```

***

##Events: *output*

```
gracenode.log.on('output', function (address, name, level, messageObj) {
	// address: IP address of the server
	// name: the name that was set on gracenode.log.create()
	// level: verbose, debug, info, warning, error, or fatal
	// messageObj: { message, timestamp }
});
```

***

###.forceFlush(callback [function])

Forcefully flushes all buffered log data and write immediately.

###.create(logName [string])

Returns an instance of logger object.

***

## Logger Object

###API: *verbose*

<pre>
void verbose(mixed data, [...])
</pre>

###API: *debug*

<pre>
void debug(mixed data, [...])
</pre>

###API: *info*

<pre>
void info(mixed data, [...])
</pre>

###API: *warning*

<pre>
void warning(mixed data, [...])
</pre>

###API: *error*

<pre>
void error(mixed data, [...])
</pre>

###API: *fatal*

<pre>
void fatal(mixed data, [...])
</pre>

***

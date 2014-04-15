Handles logging

###type: "stdout"
Sends log data to stdout tream.
###type: "remote"
Sends log data to a remote server via UDP.
###type: "file"
Writes log data to files in the file system.

#gracenode.log

###Access
```javascript
var log = gracenode.log.create('nameToBeDisplayed');
```

###Configuration
```javascript
{
	"modules":
		"log": {
			"file": "<log directory path> or false"
			"remote": {
				"host": "<host name or ip address>",
				"port"" "<port>"
			},
			"console": <boolean>,
			"color": true or false,
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

##Events: *output*

```
gracenode.log.on('output', function (address, name, level, messageObj) {
	// address: IP address of the server
	// name: the name that was set on gracenode.log.create()
	// level: verbose, debug, info, warning, error, or fatal
	// messageObj: { message, timestamp }
});
```

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

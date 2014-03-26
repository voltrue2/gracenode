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
			}
			"mongodb": {
				"host": "<host name or ip addres>",
				"port": "<port>",
				"collection": "<collection name>"
			},
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

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
			"type": "stdout", "remote", or "file",
			"remoteServer": {
				"host": <optional> for type "remote"
				"port"" <optional> for type "remote"
			}
			"color": true or false,
			"level": {
				"verbose": { "enabled": true or false, "path": "file path for the log file to be written (required if type is "file")" },
				"debug": { "enabled": true or false, "path": "file path for the log file to be written (required if type is "file")" },
				"info": { "enabled": true or false, "path": "file path for the log file to be written (required if type is "file")" },
				"warning": { "enabled": true or false, "path": "file path for the log file to be written (required if type is "file")" },
				"error": { "enabled": true or false, "path": "file path for the log file to be written (required if type is "file")" },
				"fatal": { "enabled": true or false, "path": "file path for the log file to be written (required if type is "file")" }
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

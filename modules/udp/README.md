#### <span id="udp-module">udp module</span>
***

Access
<pre>
gracenode.udp
</pre>

Configurations
```javascript
"modules": {
	"udp": {
		"servers": [
			{ name: "unique name for server", "host": "host name or IP", "port": port number }[...]
		],
		"requests": {
			"unique request name": { "host": "host name or IP", "port": port number }
		}
	}
}
```

#####API: startServers

<pre>
void startServers(Function callback)
</pre>
> Starts all UDP servers and calls the callback function when all the servers are up

#####API: getServerByName

<pre>
Object getServerByName(String serverName)
</pre>
> Returns a server object by a server name defined in the configurations
>> *startServer* MUST be called before invoking this function

Example
```javascript
var server = gracenode.udp.getServerByName('server');

// handle UDP message requests
server.on('message', function (messageBuffer, requestObj) {
	// do something
});

// handle error
server.on('error', function (error) {
	// handle error
});
```

#####API: send

<pre>
void send(String requestName, Mixed message, Object options, Function callback)
</pre>
> Sends a UDP packet message to destination named in the configurations
>> The callback returns error as the first argument and bytes sent as the second argument

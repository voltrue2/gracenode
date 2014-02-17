#### <span id="request-module">request module</span>
***

Access
<pre>
gracenode.request
</pre>

Configurations
N/A

#####API: *send*
<pre>
void send(Object params, Object options, Function callback)
</pre>
> Sends an HTTP or HTTPS request and recieve the response
>> ```javascript
// arguments
// params
{
	protocol: 'http' or 'https',
	host: 'host name',
	path: 'URI',
	port: int,
	method: string,
	data: object
}
// options
{
	headers: object,
	timeout: int (in miliseconds)
}
// usage example
request.send(params, options, function (error, response) {
	// do something there
});
```
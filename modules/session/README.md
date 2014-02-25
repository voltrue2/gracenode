***
Session
***

Access
<pre>
gracenode.session
</pre>

Configurations
```javascript
"modules": {
	"session": {
		"hosts": ["server host or IP address"...],
		"ttl": int (in seconds),
		"options": object
	}
}
```

#####API: *getSession*

<pre>
void getSession(String sessionId, Function callback)
</pre>
> Passes a session object to the callback

#####API: *setSession*
<pre>
void setSession(String, sessionId, mixed value, Function callback)
</pre>

#####API: *delSession*
<pre>
void delSession(String sessionId, Function callback)
</pre>

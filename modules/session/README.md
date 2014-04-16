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
		"ttl": int (in seconds)
	}
}
```

Session module itself does NOT handle reading and writting of the session data.

#####API: *setGetter*
Used to read data for getSession
<pre>
void setGetter(Function getterFunction);
</pre>

#####API: *setSetter*
Used to store data for setSession
<pre>
void setSetter(Function setterFunction);
</pre>

#####API: *setRemover*
Used to delte data for delSession
<pre>
void setRemover(Function removerFunction);
</pre>

#####API: *setFlusher*
Used to flush data for flush
<pre>
void setFlusher(Function flusherFunction);
</pre>

####API: *get*
Shorthand for getSession.

####API: *set*
Shorthand for setSession.

####API: *del*
Shorthand for delSession.

####API: *flush*
Shorthand for flushSession.

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

#####API: *flushSession*
<pre>
void flush(Function callback)
</pre>

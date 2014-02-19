#gracenode.lib

###Configuration
*N/A*

###API: *randomInt*
<pre>
Int randomInt(Int min, Int max)
</pre>
Returns pseudo-random integer between min and max

###API: *getArguments*
<pre>
Array getArguments(Function func)
</pre>
Returns an array of arguments for the given function

```javascript

function foo(num1, num2) {
	return num1 + num2;
}

var args = gracenode.lib.getArguments(foo);
// args = ["num1", "num2"];
```

###API: *walkDir*
<pre>
void walkDir(String path, Function callback)
</pre>
Recursively walks the given path and passes an array of file paths to the callback function

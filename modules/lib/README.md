#gracenode.lib

###Configuration
*N/A*

####randomInt
<pre>
Int randomInt(Int min, Int max)
</pre>
Returns a pseudo-random integer between min and max

####randomFloat
<pre>
Float randomFloat(Float min, Float max)
</pre>
Returns a pseudo-random floating point number between min and max

####getArguments
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

####walkDir
<pre>
void walkDir(String path, Function callback)
</pre>
Recursively walks the given path and passes an array of file paths to the callback function

####cloneObj
<pre>
Mixed cloneObj(Object obj)
</pre>
Returns a clone of given object. In javascript, objects are passed around as references. Use this in order to avoid mutating the original objects.


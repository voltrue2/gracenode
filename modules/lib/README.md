#gracenode.lib

###Configuration
*N/A*

####argv

<pre>
mixed argv(String key)
</pre>
Returns true or a value associated to the key given as an argument.

Example:

```
node myGracenodeApp/ -test --hello=world

// in your application:
var value = gracenode.lib.argv('test');
// this will return true.
var value = gracenode.lib.argv('hello');
// this will return 'world'.
```

####typeCast

<pre>
mixed typeCast(String value);
</pre>

Converts a given string value to  appropriate data type

Example:

```
var num = gracenode.lib.typeCast('100');
// 100
var float = gracenode.lib.typeCast('1.5');
// 1.5
var truthy = gracenode.lib.typeCast('true');
// true
var obj = gracenode.lib.typeCast('{"example":1,"blah":"test"}');
// { example: 1, blah: 'test' }
```

####randomInt
<pre>
Int randomInt(Int min, Int max)
</pre>
Returns a pseudo-random integer between min and max

####randomFloat
<pre>
Float randomFloat(Float min, Float max, Int precision)
</pre>
Returns a pseudo-random floating point number between min and max

The thrid argument "precision" is optional and default is 2.

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


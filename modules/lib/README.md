#gracenode.lib

###Configuration
*N/A*

####.find(findFrom [object], findMethod [function])

Returns an array of matched elements and their indexes/keys from either an object or an array.

If there are no matched elements, an empty array is returned.

Example With Array:

```javascript
var list = [
        { name: 'Bob', age: 40 },
        { name: 'John', age: 37 },
        { name: 'Chris', age: 44 },
        { name: 'Dale', age: 51 }
];
var finder = function (elm) {
        return elm.age >= 40 && elm.age <= 50;
};
var matched = gracenode.lib.find(list, finder);
/*
matched: [
        { index: 0, element: { name: 'Bob', age: 40 } },
        { index: 2, element: { name: 'Chris', age: 44 } }
]
*/
```

Example With Object:

```javascript
var map = {
        a00: { name: 'Bob', age: 40 },
        a01: { name: 'John', age: 37 },
        a02: { name: 'Chris', age: 44 },
        a03: { name: 'Dale', age: 51 }
};
var finder = function (elm) {
        return elm.age >= 40 && elm.age <= 50;
};
var matched = gracenode.lib.find(map, finder);
/*
matched: [
        { index: 'a00', element: { name: 'Bob', age: 40 } },
        { index: 'a02', element: { name: 'Chris', age: 44 } }
]
*/
```

####.typeCast(value [string])

Converts a given string value to  appropriate data type.

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

####.randomInt(min [number], max [number])

Returns a pseudo-random integer between min and max.

####.randomFloat(min [number], max [number])

Returns a pseudo-random floating point number between min and max.

The thrid argument "precision" is optional and default is 2.

####.getArguments(func [function])

Returns an array of arguments that the given function expects.

```javascript

function foo(num1, num2) {
        return num1 + num2;
}

var args = gracenode.lib.getArguments(foo);
// args = ["num1", "num2"];
```

####.walkDir(directoryPath [string], callback [function])

Recursively walks the given path and passes an array of file paths to the callback function.

####.cloneObj(obj [object], propNames [array])

Returns a clone of given object. In javascript, objects are passed around as references. Use this in order to avoid mutating the original objects.

If propNames is given, the function will clone ONLY the properties given in propNames array.

####.createTimedData(config [object])

Returns an instance of TimedData that changes its value over time.

Configs:

```javascript
{
    "max": 10, // maximum value
    "min": 0, // minimum value
    "interval": 60000, // value increments/decrements every "interval"
    "step": 1, // at every interval, the value increments/decrements by "step"
    "type": "inc", // either "inc" for incrementing type of "dec" for decrementing type
    init: 10 // initial value to start with
}
```


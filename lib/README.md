# gracenode.lib

## .bsearch(listOfObjects [array], objectKey [string], value [number])

Performces a binary search on an array of objects.

**NOTE**: The array must be pre-sorted.

## .brange(listOfObjects [array], objectKey [string], valueFrom [number], valueTo [number])

## .padNumber(num [number], digit [*number])

Returns a padded/none-padded with leading zero string.

Example:

```javascript
var paddedNine = gracenode.lib.padNumber(9, 2);
// paddedNine = '09';
var nonePaddedTen = gracenode.lib.padNumber(10, 2);
// nonePaddedTen = '10';
var paddedTen = gracenode.lib.padNumber(10, 3);
// paddedTen = '010';
var nonePaddedHundred = gracenode.lib.padNumber(100, 3);
// nonePaddedHundred = '100';
```

## .getDates(startDate [object], endDate [object])

Returns an array of date objects between `startDate` amd `endDate`.

Example:

```javascript
var dates = gracenode.lib.getDates(new Date('2015-04-22'), new Date('2015-05-22'));
// dates will contain date objects between 2015/04/22 and 2015/05/22
```

## .find(findFrom [object], findMethod [function])

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

## .typeCast(value [string])

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

## .randomInt(min [number], max [number])

Returns a pseudo-random integer between min and max.

## .randomFloat(min [number], max [number])

Returns a pseudo-random floating point number between min and max.

The thrid argument "precision" is optional and default is 2.

## .getArguments(func [function])

Returns an array of arguments that the given function expects.

```javascript

function foo(num1, num2) {
        return num1 + num2;
}

var args = gracenode.lib.getArguments(foo);
// args = ["num1", "num2"];
```

## .walkDir(directoryPath [string], callback [function])

Recursively walks the given path and passes an array of file paths to the callback function.

## .deepCopy(obj [object])

Returns a deep copied object. Use this function instead of `gracenode.lib.cloneObj()`.

## .cloneObj(obj [object], propNames [array]) (Deprecated)

Returns a clone of given object. In javascript, objects are passed around as references. Use this in order to avoid mutating the original objects.

If propNames is given, the function will clone ONLY the properties given in propNames array.

## .createTimedData(config [object])

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

Usage Example:

TimedData that recovers its value by 1 every 1 second.

```javascript
var config = {
	max: 10,
	min: 0,
	interval: 1000,
	step: 1,
	type: 'inc',
	init: 0
};
var td = gracenode.lib.createTimedData(config);
setTimeout(function () {
	var value = td.getValue();
	// value should be 1
}, 1000);
```

```javascript
var config = {
	max: 10,
	min: 0,
	interval: 1000,
	step: 1,
	type: 'inc',
	init: 10
};
var td = gracenode.lib.createTimedData(config);
td.dec(5);
setTimeout(function () {
	var value = td.getValue();
	// value should be 6
}, 1000);
```

## TimedData Class

## .getValue()

Returns the current value.

## .inc(incrementValue [number])

Increments the current value by incrementValue.

Returns `true` if successful.

## .dec(decrementValue [number])

Decrements the current value by decrementValue.

Returns `true` if successful.

## .reset()

Resets the state of `TimedData` object to its initial state.

## .getMaxValue()

Returns maximum value.

## .getMinValue()

Returns minimum value.

## .getInterval()

Returns the interval for every update in milliseconds.

## .getStep()

Returns the value of step for every update.

## .toObject()

Returns a JSON format of `TimedData` object.

## .createDateTime(time [*mix], defaultFormat [*string])

Returns an instance of DateTime object.

`time` can be a `YYYY-MM-DD HH:MM:SS` style string, javascript Date object, or timestamp such as `Date.now()`.

Example:

```javascript
var dt = gracenode.lib.createDateTime();
var fomratted = dt.format('m/d/Y H:M:S');
// e.g. 04/28/2015 21:13:09
```

# DateTime Object

## Methods

## .format(format [*string])

Returns a formatted date time string.

If default format is set and the format string is not passed to `.format()`, default format will be used.

Example With Format:

```javascript
var dt = gracenode.lib.createDateTime('2015-04-30 09:52:00');
var formattedDate = dt.format('m/d/y H:M');
console.log(formattedDate);
// 04/30/15 09:52
```

Example With Default Format:

```javascript
var dt = gracenode.lib.createDateTime('2015-04-30 14:30:00', 'Y/m/d H:I');
var formattedDate = dt.format();
console.log(formattedDate);
// 2015/04/30 02:30
```

## Formatting rules

|Format|Meaning|
|---|---|
|y|The last 2 digit of the year|
|Y|Year|
|m|Month with leading 0|
|n|Shortened name of a month|
|f|Full name of a month|
|d|Date with leading 0|
|H|Hours with leading 0 in 24 hours format|
|I|Hours with leading 0 in 12 hours format|
|M|Minutes with leading 0|
|S|Seconds with leading 0|
|N|Milliseconds with leading 0|

## .offsetInDays(offset [number])

Offests the date.

**NOTE**: By giving more than 30 days or 365 days, it can exceed current year or month.

Example:

```javascripript
var dt = gracenode.lib.createDateTime();
// 1 day in the future
dt.offsetInDays(1);
```

```javascripript
var dt = gracenode.lib.createDateTime();
// 1 day in the past
dt.offsetInDays(-1);
```
## .offsetInHours(offset [number])

Offests the hours.

**NOTE**: By giving more than 24 hours, it can exceed current date and so on.

Example:

```javascripript
var dt = gracenode.lib.createDateTime();
// 1 hour in the future
dt.offsetInHours(1);
```

```javascripript
var dt = gracenode.lib.createDateTime();
// 1 hour in the past
dt.offsetInHours(-1);
```

## .now()

Returns a unix timestamp in milliseconds.

## .getDaysInRange(date [mix])

Returns an array of DateTime objects within the given range.

**NOTE**: `date` can be either DateTime or Date.

Example:

```javascript
var dt = gracenode.lib.createDateTime('2015-01-01');
var dates = dt.getDaysInRange(gracenode.lib.createDateTime('2015-01-10'));
// dates = [ ... ];
// dates will contain instances of DateTime object from 2015-01-01 to 2015-01-10
````

***

## gracenode.lib.uuid.v4()

Returns a UUID object.

Example:

```javascript
var uuid = gracenode.lib.uuid.v4();
// 128 bits UUID string
var uuidString = uuid.toString();
// UUID in raw binary
var uuidBuffer = uuid.toBytes();
// length of UUID string
var uuidStringLen = uuid.getLength();
// length of UUID binary
var uuidBuffLen = uuid.getByteLength();
```

## gracenode.lib.uuid.create(input [mix])

Creates a UUID object from `input`.

`input` can be a UUID string, UUID binary, or UUID object.

#### gracenode.lib.packet.createRequest(commandId {number}, sequence {number}, data {object})

Creates a binary packet of fixed format for a command request used in `UDP` and `RPC`.

#### gracenode.lib.packet.createReply(status {number}, sequence {number}, data {object})

Creates a binary packet of fixed format for a reply (to a command request) used in `UDP` and `RPC`.

#### gracenode.lib.packet.createPush(sequence {number}, data {object})

Creates a binary packet of fixed format for a push message from server used in `UDP` and `RPC`.

#### gracenode.lib.packet.parse(packet {buffer})

Parses a binary packet used in `UDP` and `RPC` to an object.

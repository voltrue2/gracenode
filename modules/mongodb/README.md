"""
#### <span id="mongodb-module">mongodb module</span>
***

Access
<pre>
gracenode.mongodb
</pre>

Configurations
```javascript
"modules": {
	"mongodb": {
		"configNameOfYourChoice": {
			"host": "host name or IP address",
			"port": <port number>,
			"database": "database name",
			"poolSize": <optional>
		}{...}
	}
}
```

#####API: *create*
<pre>
Db create(String configName)
</pre>
> Returns an instance of Db class

##### Db class

> **collection**
<pre>
Collection collection(String collectionName)
</pre>
> Returns an instance of Collection class

##### Collection class

> **findOne**
<pre>
void findOne(Object query, Array, fields, Function callback)
</pre>
```javascript
var myDb = gracenode.mongodb.create('myDb');
var myCol = myDb.collection('myCol');
myCol.findOne({ _id: 123456 }, ['_id', 'name'], function (error, doc) {
	// do something
});
```

> **findMany**
<pre>
void findMany(Object query, Array fields, Object pagenate, Function callback)
</pre>
```javascript
var myDb = gracenode.mongodb.create('myDb');
var myCol = myDb.collection('myCol');
// query upto 10 documents and offset from 5th record matched. Plus sort the records by 'age'
myCol.findMany({ _id: 123456 }, ['_id', 'name'], { limit: 10, offset: 5, sort: 'age' }, function (error, doc) {
	// do something
});
```

> **findEach**
<pre>
void findEach(Object querym Array fields, Int limit, Object [sort*], Function eachCallback, Function finalCallback)
</pre>
Executes findMany with the given limit and auto-iterate until it finds no more record. Each iteration will call eachCallback.
When it reaches the end, it will call finalCallback.
This operation can be very expensive.
Example:
```javascript
var myDb = gracenode.mongodb.create('myDb');
var myCol = gracenode.mongodb.collection('myCol');
myCol.findEach({ _id: /name/ }, ['age'], { age: -1 }, function (list, next) {
	// do something with list
	next();
},
function (error) {
	// done
});
```

> **ensureIndex**
<pre>
void ensureIndex(Object indexes, Object options, Function callback)
</pre>

> **insert**
<pre>
void insert(Object values, Function callback)
</pre>

> **update**
(safe and multi are always true and upsert is false)
<pre>
void update(Object conditions, Object updates, Function callback)
</pre>

> **upsert**
<pre>
void upsert(Object conditions, Object updates, Boolean multi, Function callback)
</pre>

> **increment**
(does NOT allow the target property to exceed maximum number given)
<pre>
void increment(Object conditions, String propertyName, Number incrementBy, Number maximumNumberAllowed, Function callback)
</pre>

> **decrement**
(does NOT allow the target property to fall below 0)
<pre>
void decrement(Object conditions, String propertyName, Number decrementBy, Function callback)
</pre>

> **save**
<pre>
void save(Object values, Function callback)
</pre>

> **delete**
<pre>
void delete(Object values, Function callback)
</pre>

> **findAndModify**
<pre>
void fundAndModify(Object query, Object sort, Object update, Object options, Function callback)
</pre>

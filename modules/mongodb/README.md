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

> **insert**
<pre>
void insert(Object values, Function callback)
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

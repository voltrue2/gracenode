#### <span id="mysql-module">mysql module</span>
***

Access
<pre>
gracenode.mysql
</pre>

Configurations
```javascript
"modules": {
	"mysql": {
		"configNameOfYourChoice": {
			"read": {
				"database": "databaseName",
				"host": "host or IP address",
				"user": "databaseUser",
				"password": "databasePassword"
			},
			"write": {
				"database": "databaseName",
				"host": "host or IP address",
				"user": "databaseUser",
				"password": "databasePassword"
			}
		}{...}
	}
}
```

#####API: *create*
<pre>
MySql create(String configName)
</pre>
> Returns an instance of MySqlGroup class

##### MySqlGroup class

> **getOne**
<pre>
void getOne(String sql, Array params, Function callback)
</pre>
> Executes a "select" SQL query and passes a result to callback.
>> If no result is found, the funtion will throw an error.
```javascript
var mysql = gracenode.mysql.create('peopleDb');
mysql.getOne('SELECT age, gender FROM people WHERE name = ?', ['bob'], function (error, result) {
	if (error) {
		throw new Error('nothing found');
	}	
	// do something here
});
```

> **getMany**
<pre>
void getMany(String sql, Array params, Function callback)
</pre>
> Executes a "select" SQL query and passes results to callback
>> If no result is found, the function will throw an error.

> **searchOne**
<pre>
void searchOne(String sql, Array params, Function callback)
</pre>
> Executes a "select" SQL query and passes a result to callback
>> No result will **NOT** throw an error.


> **searchMany**
<pre>
void searchMany(String sql, Array params, Function callback)
</pre>
> Executes a "select" SQL query and passes results to callback
>> No result will **NOT** throw an error.

> **write**
<pre>
void write(String sql, Array params, Function callback)
</pre>
> Executes "insert/update/delete/truncate/alter/create/drop/" SQL query
>> Can **NOT** be executed if the *type* is "ro"

> **transaction**
<pre>
void transaction(Function taskCallback, Function callback)
</pre>
> Creates Mysql transaction and allows you to execute transactional SQL queries in taskCallback.
>> Commit will be executed automatically on successful execution of taskCallback
>>> An error in taskCallback will cause auto-rollback and ends the transaction.
>>>> Can **NOT** be executed if the *type* is "ro"
```javascript
var mysql = gracenode.mysql.create('animalDb');
mysql.transaction(function (transactionMysql, finishCallback) {
	transactionMysql.write('INSERT INTO animal (name, species) VALUES(?, ?)', ['dog', 'knine'], function (error, res) {
		if (error) {
			return finishCallback(error);
		}
		transactionMysql.write('INSERT INTO food (animalName, amount) VALUES(?, ?)', ['dog', 10], function (error, res) {
			if (error) {
				return finishCallback(error);
			}
			// taskCallback is done. now move forward
			finishCallback();
		});
	});
}, 
function (error) {
	if (error) {
		throw new Error(error);
	}
	// All done and committed
});
```

> **placeHolder**
<pre>
Array placeHolder(Array params)
</pre>
> Creates and returns an array of *?* based on params given.
```javascript
var mysql = gracenode.create('people');
var params = ['jenny', 'ben', 'krista', 'ken'];
mysql.searchMany('SELECT * FROM people WHERE name IN (' + mylsq.placeHolder(params) + ')', params, function (error, res) {
	if (error) {
		throw new Error(error);
	}	
	// do something here
});
```

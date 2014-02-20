Configurations
```javascript
"modules": {
        "hosts": ["hostName"...] or { "hostName": int (load balance)...},
        "ttl": int, // in seconds
        "options": Object
}
```

#####API: *create*

<pre>
Cache create(String name)
</pre>
> Returns an instance of Cache class.
>> Cache class uses memcache.

##### Cache class

> **get**
<pre>
void get(String key, Function callback)
</pre>
> Read a value associated with the given key.
```javascript
var peopleTable = gracenode.mysql.create('people');
var peopleCache = gracenode.datacache.create('people');
var sql = 'SELECT * FROM people WHERE name = ?';
var params = ['bob'];
peopleCache.get(sql + params.json(''), function (error, value) {
        if (error) {
                throw new Error(error);
        }
        if (value) {
                // we found the value > do something with it.
        } else {
                // no cache found
                peopleTable.getOne(sql, param, function (error, res) {
                        if (error) {
                                throw new Error(error);
                        }
                        // set cache
                        peopleCache.set(sql + params.json(''), res, function (error) {
                                if (error) {
                                        throw new Error(error);
                                }
                                // we are done
                        });
                });
        });
});
```

> **set**
<pre>
void set(String key, mixed value, Function callback)
</pre>
> Sets a value associated with the given key.
```javascript
var peopleTable = gracenode.mysql.create('people');
var peopleCache = gracenode.datacache.create('people');
var sql = 'SELECT * FROM people WHERE name = ?';
var params = ['bob'];
peopleCache.get(sql + params.json(''), function (error, value) {
        if (error) {
                throw new Error(error);
        }
        if (value) {
                // we found the value > do something with it.
        } else {
                // no cache found
                peopleTable.getOne(sql, param, function (error, res) {
                        if (error) {
                                throw new Error(error);
                        }
                        // set cache
                        peopleCache.set(sql + params.json(''), res, function (error) {
                                if (error) {
                                        throw new Error(error);
                                }
                                // we are done
                        });
                });
        });
});
```

> How to flush old cache
```javascript
// flush old cache value on updated mysql data
var peopleTable = gracenode.mysql.create('people');
var peopleCache = gracenode.datacache.create('people');
var sql = 'UPDATE people SET age = ? WHERE name = ?';
var params = [40, 'bob'];
peopleTable.write(sql, params, function (error) {
        if (error) {
                throw new Error(error);
        }
        // successfully updated > now we need to flush out the old cache
        peopleCache.update(function (error) {
                if (error) {
                        throw new Error(error);
                }
                // we are done
        });
});
```

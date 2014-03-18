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

> **getOne**
<pre>
void get(String key, Function callback)
</pre>
> Read a value associated with the given key.
```javascript
var peopleTable = gracenode.mysql.create('people');
var peopleCache = gracenode.memcache.create('people');
var sql = 'SELECT * FROM people WHERE name = ?';
var params = ['bob'];
peopleCache.getOne(sql + params.json(''), function (error, value) {
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
                        peopleCache.set(sql + params.join(''), res, function (error) {
                                if (error) {
                                        throw new Error(error);
                                }
                                // we are done
                        });
                });
        });
});
```

> **getMany**
<pre>
void getMany(Array keyList, Function callback)
</pre>

> **replace**
<pre>
void replace(String key, mixed value, Function callback)
</pre>

> **set**
<pre>
void set(String key, mixed value, Function callback)
</pre>
> Sets a value associated with the given key.
```javascript
var peopleTable = gracenode.mysql.create('people');
var peopleCache = gracenode.memcache.create('people');
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
                        peopleCache.set(sql + params.join(''), res, function (error) {
                                if (error) {
                                        throw new Error(error);
                                }
                                // we are done
                        });
                });
        });
});
```

> How to delete old cache
```javascript
// delete old cache value on updated mysql data
var peopleTable = gracenode.mysql.create('people');
var peopleCache = gracenode.memcache.create('people');
var sql = 'UPDATE people SET age = ? WHERE name = ?';
var params = [40, 'bob'];
peopleTable.write(sql, params, function (error) {
        if (error) {
                throw new Error(error);
        }
        // successfully updated > now delete the old cache
        peopleCache.del(sql + params.join(''), function (error) {
                if (error) {
                        throw new Error(error);
                }
                // we are done
        });
});
```

> **del**
<pre>
void del(String key, Function callback)
</pre>

> **flush**
<pre>
void flush(Function callback)
</pre>

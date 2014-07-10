#gracenode.config

###Configuration
*N/A*

###API .getOne

```
mixed getOne(String propName)
```

Returns the value of configuration property

Example

```javascript
// configuration JSON
{ "foo": 
    { 
         "boo": 1
    }
}
// query the value of "foo"
var foo = gracenode.config.getOne("foo");
// foo = { "boo": 1 };

// query the value of "boo"
var boo = gracenode.config.getOne("foo.boo");
// boo = 1
```

###API .getMany

```
Object getMany(Array propNameList)
```

Returns the values of configuration properties

###API .getAll

```
Object getAll()
```

Returns the whole configuration object.

***

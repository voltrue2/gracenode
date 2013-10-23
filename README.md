##How to set it up
<pre>
$ cd yourApp/
$ git clone https://github.com/voltrue2/GraceNode GraceNode
$ cd GraceNode/
$ npm install
</pre>

> If you execute the above commands and every thing goes fine, GraceNode is successfully installed along with its dependencies

##Create configuration files
<pre>
$ cd yourApp/
$ mkdir configs/
</pre>
> You will then create your configuration file(s) under configs/ directory. The format is JSON. For reference please refer to GraceNode/example-config.json

##index.js file for bootstrapping
<pre>
$ cd yourApp/
$ ls -la
$ ..
$  .
$ index.js
$ GraceNode/
</pre>
> GraceNode needs to be set up for it to run correctly.
>> Below is the example code to set up GraceNode in index.js

```javascript
var gracenode = require('../GraceNode/gracenode');
// tell GraceNode where to look for configuration file(s)
// we will explain the effect of the function "gracenode.getRootPath()" later.
gracenode.setConfigPath(gracenode.getRootPath() + 'configs/');
// tell GraceNode the name(s) of configuration files to load
gracenode.setConfigFiles(['base.json', 'modules.json']);
// decide what module(s) of GraceNode to use in your application.
// we will explain this in more detail later.
gracenode.use('server', 'server');
gracenode.use('view', 'view');
gracenode.use('mysql', 'mysql');
// now start the set up process
gracenode.setup(function (error) {
    if (error) {
        throw new Error('GraceNode failed to set up: ' + error);
    }
    // GraceNode is ready to go

});
```

## GraceNode Built-in Modules
> GraceNode has some built-in modules.

#### Automatically loaded by GraceNode on setup
- config
- log
- profiler
- lib

#### Other optional modules
- staticdata
- request
- server
- view
- session
- encrypt
- mysql
- datacache

### Built-in Modules

***
#### config module
*** 

Access
<pre>
gracenode.config
</pre>

Configurations
*N/A*

#####API: *getOne*

<pre>
mixed getOne(String propName)
</pre>
> Returns the value of configuration property
>> Example

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

#####API: *getMany*

<pre>
Object getMany(Array propNameList)
</pre>
> Returns the values of configuration properties

***
####log module
***

Access
```javascript
var log = gracenode.log.create('nameToBeDisplayed');
```

Configurations
```javascript
{
	"modules":
		"log": {
			"type": "stdout" or "file",
			"color": true or false,
			"level": {
				"verbose": { "enabled": true or false, "path": "file path for the log file to be written (required if type is "file")" },
				"debug": { "enabled": true or false, "path": "file path for the log file to be written (required if type is "file")" },
				"info": { "enabled": true or false, "path": "file path for the log file to be written (required if type is "file")" },
				"warning": { "enabled": true or false, "path": "file path for the log file to be written (required if type is "file")" },
				"error": { "enabled": true or false, "path": "file path for the log file to be written (required if type is "file")" },
				"fatal": { "enabled": true or false, "path": "file path for the log file to be written (required if type is "file")" }
			}
		}
}
```

#####API: *verbose*

<pre>
void verbose(mixed data, [...])
</pre>

#####API: *debug*

<pre>
void debug(mixed data, [...])
</pre>

#####API: *info*

<pre>
void info(mixed data, [...])
</pre>

#####API: *warning*

<pre>
void warning(mixed data, [...])
</pre>

#####API: *error*

<pre>
void error(mixed data, [...])
</pre>

#####API: *fatal*

<pre>
void fatal(mixed data, [...])
</pre>

***
#### profiler module
***

Access
<pre>
gracenote.profiler
</pre>

Configurations
*N/A*

#####API: *start*
<pre>
void start()
</pre>
> Starts profiling

#####API: *mark*

<pre>
void mark(String benchmarkPointName)
</pre>
> Calculate elapsed time between marks and output on profiler.stop()

#####API: *stop*

<pre>
void stop()
</pre>
> Stops profiler and output the profiling results

***
#### lib module
***

Access
<pre>
gracenode.lib
</pre>

Configurations *N/A*

#####API: *randomInt*
<pre>
Int randomInt(Int min, Int max)
</pre>
> Returns pseudo-random integer between min and max

#####API: *getArguments*
<pre>
Array getArguments(Function func)
</pre>
> Returns an array of arguments for the given function

```javascript

function foo(num1, num2) {
	return num1 + num2;
}

var args = gracenode.lib.getArguments(foo);
// args = ["num1", "num2"];
```

#####API: *walkDir*
<pre>
void walkDir(String path, Function callback)
</pre>
> Recursively walks the given path and passes an array of file paths to the callback function


***
#### staticdata module
***

Access
<pre>
// do this in your bootstrap file (index.js) before invoking gracenode.setup().
gracenode.use('gracenode', 'gracenode');
// once gracenode.setup is finished. you can access the module as following:
gracenode.staticdata
</pre>

Configurations
```javascript
// staticdata module supports CSV and JSON format
{
	"modules": {
		"staticdata": {
			"path": "directory path to the static files",
			"linebreak": optional and defaults to '\n', // for parsing CSV files
			"delimiter": optional and defaults to ',', // for parsing CSV files
			"quote": optional and defaults to '"' // for parsing CSV files
			"index": { // optional // for getOneByIndex and getManyByIndex
				"staticFileName": ["indexName", [...]]
			}
		}
	}
}
```

#####API: *getOne*
<pre>
StaticData getOne(String dataName)
</pre>
> Returns and instance of StaticData class
>> Example:
```javascript
/* 
In order to create a static data object from a static data file called "example.csv",
do the following:
*/
var example = gracenode.staticdata.getOne('example');
```

#####API: *getMany*
<pre>
Object getMany(Array dataNameList)
</pre>

##### StaticData class

> **getOneByIndex**
<pre>
mixed getOneByIndex(String indexName, String indexKey, Function callback)
</pre>
**getManyByIndex**
<pre>
mixed getManyByIndex(String indexName, Array indexKeyList, Function callback)
</pre>
**getOne**
<pre>
mixed getOne(mixed key, Function callback)
</pre>
**getMany**
<pre>
mixed getMany(Array keyList, Function callback)
</pre>
**getAll**
<pre>
mixed getAll(Function calback)
</pre>

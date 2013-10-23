Author: Nobuyori Takahashi

Since 2013 to present

Contact: voltrue2@yahoo.com

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
- <a href="#config-module">config</a>
- <a href="#log-module">log</a>
- <a href="#profiler-module">profiler</a>
- <a href="#lib-module">lib</a>

#### Other optional modules
- <a href="#staticdata-module">staticdata</a>
- <a href="#request-module">request</a>
- <a href="#server-module">server</a>
- <a href="#view-module">view</a>
- <a href="#session-module">session</a>
- <a href="#encrypt-module">encrypt</a>
- <a href="#mysql-module">mysql</a>
- <a href="#datacache-module">datacache</a>

### Built-in Modules

***
#### <span id="config-module">config module</a>
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
#### <span id="log-module">log module</span>
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
#### <span id="profiler-module">profiler module</span>
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
#### <span id="lib-module">lib module</span>
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
#### <span id="staticdata-module">staticdata module</span>
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

***
#### <span id="request-module">request module</span>
***

Access
<pre>
gracenode.request
</pre>

Configurations
N/A

#####API: *send*
<pre>
void send(Object params, Object options, Function callback)
</pre>
> Sends an HTTP or HTTPS request and recieve the response
>> ```javascript
// arguments
// params
{
	protocol: 'http' or 'https',
	host: 'host name',
	path: 'URI',
	port: int,
	method: string,
	data: object
}
// options
{
	headers: object,
	timeout: int (in miliseconds)
}
// usage example
request.send(params, options, function (error, response) {
	// do something there
});
```

***
#### <span id="server-module">server module</span>
***

Access
<pre>
gracenode.server
</pre>

Configurations
```javascript
"modules": {
	"server": {
		"port": port number,
		"host": host name or IP address,
		"controllerPath": path to controller directory,
		"ignored": ['name of ignored URI'...],
		"error": {
			"404": {
				"controller": controller name,
				"method": public controller method
			},
			"500": ...
		},
		"reroute": [
			{
				"from": '/',
				"to": 'another/place'
			},
			...
		]
	}
}
```

######API: *start*

<pre>
void start()
</pre>
> Starts an HTTP or HTTPS server

#####API: *userError*

<pre>
void userError(mixed error, mixed response, Function callback)
</pre>
> Responds to the client with status code **404**

#####API: *error*

<pre>
void error(mixed error, mixed response, Function callback)
</pre>
> Responds to the client with status code **500**

###### Example:
> Example of how to set up a server
```javascript
// index.js file of an application
var gracenode = require('./GraceNode/');
gracenode.use('server', 'server');
gracenode.setup(function (error) {
	if (error) {
		throw new Error('failed to set up GraceNode');
	}
	// we start the server as soon as GraceNode is ready
	gracenode.server.start();
});
// controller/example/index.js > /example/foo/
var gracenode = require('../GraceNode/');
// this will become part of the URI
module.exports.foo = function (serverCallback) {
	// serverCallback is created by server module automatically
	cb(null. 'foo', 'JSON');
};
// /example/foo/ will display "foo" on your browser
```

***
#### <span id="view-module">view module</span>
***

Access
<pre>
gracenode.view
</pre>

Configurations
```javascript
"modules": {
	"view": {
		"preload": ["file path"...], // optional
		"minify": true or false // default is true > minify css and js files
	}
}
```

#####API: *assign*

<pre>
void assign(String name, mixed value)
</pre>
> Assigns a variable to be embeded to view file(s)
>> Exmple:
<pre>
// controller
gracenode.view.assign('foo', 'hello world');

// view file
(:= foo :)

// output
hello world
</pre>

#####API: *load*

<pre>
void load(String vilewFilePath, Function callback)
</pre>
> Loads a view file
> Example: 
```javascript
// controller file
module.exports.index = function (cb) {
	gracenode.view.assign('foo', 'hello world');
	gracenode.view.load('/foo/index.html', function (error, contentData) {
		if (error) {
			return cb(error);
		}
		cb(null, contentData, 'HTML');
	});
};
// this will output "hello world"
```

###### How to include view files
```html
<!-- include header HTML file -->
<div class="header">
(:include common/header.html :)
</div>
<!-- include CSS file -->
<style type="text/css">
(:include css/main.css :)
</style>
<!-- include Javascript file -->
<script type="text/javascript">
(:include js/main.js :)
</script>
<!-- include ALL files in the directory -->
<div class="content">
(:include content/ :)
</div>
```
>> All included files have access to the variables assigned by **assign** function.
>>> All assigned variables are also available as Javascript variables in the client under window.gracenode object

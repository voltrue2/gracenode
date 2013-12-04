Author: Nobuyori Takahashi

Since 2013 to present

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
// this will be explained in more detail later.
gracenode.use('server');
gracenode.use('view');
gracenode.use('mysql');
// now start the set up process
gracenode.setup(function (error) {
    if (error) {
        throw new Error('GraceNode failed to set up: ' + error);
    }
    // GraceNode is ready to go

});
```

## GraceNode Methods

##### setConfigPath
<pre>
void setConfigPath(String configDirectoryPath)
</pre>
> Give GraceNode the directory path to the configuration files

##### setConfigFiles
<pre>
void setConfigFiles(Array configFileList)
</pre>
> Give GraceNode the list of configuration files to be used (the files must be in the directory given to setConfigFiles)

##### use
<pre>
void use(String moduleName, Object optionalParams)
</pre>
> Indicate what module to use (this function can be used to load both built-in and custom modules)
>> optionalParams
```javascript
{ 
	path: 'path to the source code of the custom module',
	configName: 'name of configuration to be used'
}
```

> Example
```javascript
// load and use GraceNode mysql built-in module
gracenode.use('mysql');
// load and use custom module
gracenode.use('myMod', { path: 'app/customModules/myMod' });
```

##### setup
<pre>
void setup(Function callback)
</pre>
> Start the set-up process of GraceNode

##### exit
<pre>
void exit(String errorMessage)
</pre>
> Stop GraceNode process
>> errorMessage is optional and if given GraceNode will stop with an error

## GraceNode Events

##### setup.config
<pre>
gracenode.on('setup.config', callbackFunction)
</pre>
> Emitted when config module has been set up

##### setup.log
<pre>
gracenode.on('setup.log', callbackFunction)
</pre>
> Emitted when log module has been set up

##### setup.complete
<pre>
gracenode.on('setup.complete', callbackFunction)
</pre>
> Emitted when setup method finishes

##### setup.moduleName
<pre>
gracenode.on('setup.moduleName', callbackFunction);
</pre>
> Emitted when a module has been set up

##### uncaughtException
<pre>
gracenode.on('uncaughtException', callbackFunction)
</pre>
> Emitted when GraceNode catches uncaught exception

##### exit
<pre>
gracenode.on('exit')
</pre>
> Emitted when GraceNode process exits

##### shutdown
<pre>
gracenode.on('shutdown')
</pre>
> Emitted when GraceNode detects SIGINT

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
- <a href="#udp-module">udp</a>
- <a href="#view-module">view</a>
- <a href="#session-module">session</a>
- <a href="#encrypt-module">encrypt</a>
- <a href="#mysql-module">mysql</a>
- <a href="#datacache-module">datacache</a>
- <a href="#asset-module">asset</a>
- <a href="#iap-module">iap (In-App-Purchase with Apple and Google Play)</a>
- <a href="#message-module">message</a>

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

####API: *create*
<pre>
Profiler create(String name)
</pre>
> Returns an instance of Profiler class

##### Profiler class

> **start**
<pre>
void start()
</pre>
Starts profiling

> **mark**
<pre>
void mark(String benchmarkPointName)
</pre>
Calculate elapsed time between marks and output on profiler.stop()

> **stop**
<pre>
void stop()
</pre>
Stops profiler and output the profiling results

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

#####API: *create*
<pre>
StaticData create(String dataName)
</pre>
> Returns and instance of StaticData class
>> Example:
```javascript
/* 
In order to create a static data object from a static data file called "example.csv",
do the following:
*/
var example = gracenode.staticdata.create('example');
```

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
		"protocol: "http" or "https",
		"pemKey": "file path to pem key file" // https only
		"pemCert": "file path to pem cert file" // https only
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

#####API: *events*

<pre>
EventEmitter events()
</pre>
> Returns an instance of EventEmitter
>> Events: requestStart, requestEnd

######API: *setRequestHook*

<pre>
void setRequestHook(Function callback)
</pre>
> assign a function to be invoked on every request.
>> Should be used for session validatation etc
>>> Callback will have 3 arguments: request object, parsedUrl object, and callback
>>> The callback that is invoked at the end of hook callback can pass 2 arguments: error and status code
Example:
```javascript
gracenode.server.setRequestHook(function (reqObj, callback) {
	// do something
	var session = getSession(reqObj);
	if (!session) {
		return callback(new Error('no session'), 403);
	}
	callback(null, 200);
});
```

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
```
> Controller
```javascript
// controller/example/index.js > /example/foo/
var gracenode = require('../GraceNode/');
// this will become part of the URI
// the first argument is **ALWAYS** requestObject
module.exports.foo = function (requestObject, serverCallback) {
	// serverCallback is created by server module automatically
	cb(null. 'foo', 'JSON');
};
// /example/foo/ will display "foo" on your browser
```

> How to read GET and POST
```javascript
// controller file
module.exrpots.index = function (requestObject, cb) {
	// server module automatically gives every controller the following functions:
	// requestObject.getData and requestObject.postData
	var getFoo = requestObject.getData.get('foo');
	var postFoo = requestObject.postData.get('foot');
	cb(null, null, 'JSON');
};
```

> How to read request headers
```javascript
// controller file
module.exports.index = function (requestObject, cb) {
	// server module automatically gives every contrller the following function:
	// requestObject.requestHeaders > an instance of Headers class
	var os = requestObject.requestHeaders.getOs();
};
```

> #### Headers class

>> **get**
<pre>
String get(String headerName)
</pre>

>> **getOs**
<pre>
String getOs()
</pre>

>> **getBrowser**
<pre>
String getBrowser()
</pre>

>> **getDefaultLang**
<pre>
String getDefaultLang
</pre>

> How to set response headers
```javascript
// controller
module.exports.index = function (requestObject, cb) {
	// server module automatically gives every contrller the following function:
	// requestObject.setHeader
	module.exports.setHeader('myHeader', 'foo');
};
```

> How to read and set cookie
```javascript
// controller
module.exports.index = function (requestObject, cb) {
	// server module automatically gives every contrller the following functions:
	// requestObject.getCookie and module.exports.setCookie
	var sessionCookie = requestObject.getCookie('session');
	requestObject.setCookie('myCookie', 'foo');
	// for handling session please use session module
};
```

> How to handle and pass parameters
```javascript
// controller
// request URI /foo/index/one/two/
module.exports.index = function (requestObject, one, two, cb) {
	// one and two are  the values in the request URI
	// by having these parameters and the arguments, these arguments will become requirements
	// missing arguments will cause and error
};
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

#####API: *get*

<pre>
mixed get(String name)
</pre>
> Get assigned value

#####API: *load*

<pre>
void load(String vilewFilePath, Function callback)
</pre>
> Loads a view file.
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

###### Notes
> There is no **if** nor **for-loop** in view module because view template files are just template files and should not contain any sort of logic.
>> If you need to generate a list of items or change the display depending on certain conditions, please use *Javascript* to do so. After all we are using Nodejs.

***
#### <span id="session-module">session module</span>
***

Access
<pre>
gracenode.session
</pre>

Configurations
```javascript
"modules": {
	"session": {
		"hosts": ["server host or IP address"...],
		"ttl": int (in seconds),
		"options": object
	}
}
```

#####API: *getSession*

<pre>
void getSession(String sessionId, Function callback)
</pre>
> Passes a session object to the callback

#####API: *setSession*
<pre>
void setSession(String, sessionId, mixed value, Function callback)
</pre>

***
#### <span id="encrypt-module">encrypt module</span>
***

Access
<pre>
gracenode.encrypt
</pre>

Configurations
N/A

#####API: *createHash*

<pre>
void createHash(String sourceStr, Int cost, Function callback)
</pre>
> Creates a hash with salt from **sourceStr**
>> This function uses <a href="https://github.com/ncb000gt/node.bcrypt.js/">bcrypt</a> module and it is based on blowfish encryption.
>>> bigger the cost the slower this function will become.

#####API: *validateHash*

<pre>
void validateHash(String str, String hash, Function callback)
</pre>
> Validates a hash and **str**

#####API: *createSalt*

<pre>
void createSalt(Int cost, Function callback)
</pre>
> Creates a salt.

#####API: *uuid*

<pre>
String uuid(Int version, Object options, Buffer buffer, Array offset)
</pre>
> Creates a uuid. This module uses <a href="https://github.com/broofa/node-uuid">node-uuid</a> module.
>> Possible values for **version** are *1* or *4*
>>> Version 1 is timestamp-base and version 4 is random-base

***
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
			"database": "databaseName",
			"host": "host or IP address",
			"user": "databaseUser",
			"password": "databasePassword",
			"type": "ro" or "rw" // "ro" for Read Only and "rw" for Read and Write
		}...
	}
}
```

#####API: *create*
<pre>
MySql create(String configName)
</pre>
> Returns an instance of MySql class

##### MySql class

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
> **close**
<pre>
void close()
</pre>
> Closes a connection gracefully

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
mysql.transaction(function (finishCallback) {
	mysql.write('INSERT INTO animal (name, species) VALUES(?, ?)', ['dog', 'knine'], function (error, res) {
		if (error) {
			return finishCallback(error);
		}
		mysql.write('INSERT INTO food (animalName, amount) VALUES(?, ?)', ['dog', 10], function (error, res) {
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

***
#### <span id="datacache-module">datacache module</span>
***

Access
<pre>
gracenode.datacache
</pre>

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

***
#### <span id="asset-module">asset module</span>
***

Access
<pre>
gracenode.asset
</pre>

Configurations
```javascript
"modules": {
	"asset": {
		"path": "pathToAssetDirectory"
	}
}
```

#####API: *getOne*

<pre>
Object getOne(String pathName)
</pre>
> Returns asset file object(s). 
>>
```javascript
// to get a file object of /img/backgrounds/bg001.png
var bg001 = gracenode.asset.getOne('img/backgrounds/bg001');
/*
* bg001 will be:
* { key: 'img/backgrounds/bg001', type: 'png', hash: 'fd8g0f8gd==' }
*/
// to get all file objects in /img/backgrounds/
var backgrounds = gracenode.asset.getOne('img/backgrounds/');
/*
* backgrounds will be:
* { bg001: {file object}, bg002: {file object}, bg003: {file object} }
*/
```

#####API: *getMany*

<pre>
Array getMany(Array pathNameList)
</pre>
> Returns an array of asset file object(s)

#####API: *getDataByKey*

<pre>
Object getDataByKey(String assetFileKey)
</pre>
> Returns an asset data object

```javascript
// to get the binary data of /img/backgrounds/bg001.png
var bg001 = gracenode.asset.getOne('img/backgrounds/bg001');
var bg001Data = gracenode.asset.getDataByKey(bg001.key);
/*
* bg001Data will be:
* { data: binary data of the file, path: '~asset/img/backgrounds/bg001.png' }
*/
```

#####API: getDataByKeyAndHash

<pre>
Object getDataByKeyAndHash(String assetFileKey, String assetFileHash, Function callback)
</pre>
> Returns an asset data object.
>> If the file hash is old, the function will read the file and update the cache map before returning the data object

```javascript
var bg001 = gracenode.asset.getOne('img/backgrounds/bg001');
gracenode.asset.getDataByKeyAndHash(bg001.key, bg001.hash, function (error, bg001Data) {
	if (error) {
		// handle error
	}
	// do something here
});
```

***
#### <span id="udp-module">udp module</span>
***

Access
<pre>
gracenode.udp
</pre>

Configurations
```javascript
"modules": {
	"udp": {
		"servers": [
			{ name: "unique name for server", "host": "host name or IP", "port": port number }[...]
		],
		"requests": {
			"unique request name": { "host": "host name or IP", "port": port number }
		}
	}
}
```

#####API: startServers

<pre>
void startServers(Function callback)
</pre>
> Starts all UDP servers and calls the callback function when all the servers are up

#####API: getServerByName

<pre>
Object getServerByName(String serverName)
</pre>
> Returns a server object by a server name defined in the configurations
>> *startServer* MUST be called before invoking this function

Example
```javascript
var server = gracenode.udp.getServerByName('server');

// handle UDP message requests
server.on('message', function (messageBuffer, requestObj) {
	// do something
});

// handle error
server.on('error', function (error) {
	// handle error
});
```

#####API: send

<pre>
void send(String requestName, Mixed message, Object options, Function callback)
</pre>
> Sends a UDP packet message to destination named in the configurations
>> The callback returns error as the first argument and bytes sent as the second argument

***
#### <span id="iap-module">iap module</span>
***

Access
<pre>
gracenode.iap
</pre>

Configurations
```javascript
"modules": {
	"iap": {
		"sandbox": true or false,
		"sql": {
			"read": "mysql module configuration name",
			"write": "mysql module configuration name"
		},
		"googlePublicKeyPath": "path to google play public key files" // the file names MUST be specific (for live: iap-live, for sandbox: iap-sandbox)
	}
}
```

#####API: validateApplePurchase

<pre>
void validateApplePurchase(String receipt, Function cb)
</pre>
> Sends an HTTPS request to Apple to validate the given receipt and responds back an object { validateState: 'validated' or 'error', status: 'pending' or 'handled' or 'canceled' }

#####API: validateGooglePurchase

<pre>
void validateGooglePurchase(Object receipt, Function cb)
</pre>
> Validates the receipt with public key using open SSL

#####API: updateStatus

<pre>
void updateStatus(Mixed receipt, String status, Function cb)
</pre>
> Updates the status of the given receipt. the valid status are: pending, handled, canceled.

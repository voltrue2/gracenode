# gracenode 3

©Nobuyori Takahashi < voltrue2@yahoo.com >

A node.js framework for real-time applications.

[![Build Status](https://travis-ci.org/voltrue2/gracenode.svg?branch=master)](https://travis-ci.org/voltrue2/gracenode)

## Node.js Version

Version `4.0.0` or above.

## What gracenode does

- Manages **cluster process**. Read <a href="https://github.com/voltrue2/cluster-mode">here</a>.

- Handles **daemonizing** of the application and auto-restarting on file changes. Read <a href="https://github.com/voltrue2/gracenode#start-your-application-as-a-daemon">here</a>.

- Bootstrap other modules to organize setting up of each module on starting of the application process. Read <a href="https://github.com/voltrue2/gracenode#bootstrapping-other-modules">here</a>.

- Provides a built-in **logging** module. Read <a href="https://github.com/voltrue2/gracenode#logging">here</a>.

- Provides plethora of utility functions to aid development. Read <a href="https://github.com/voltrue2/gracenode/tree/develop/lib#gracenodelib">here</a>. 

- Provides **HTTP router** for web applications. Read <a href="https://github.com/voltrue2/gracenode/tree/develop/src/http#http-router">here</a>.

- Provides **UDP server** for real-time application. Read <a href="https://github.com/voltrue2/gracenode/tree/develop/src/udp#udp-server">here</a>.

- Provides **RPC server** over **TCP** for real-time application. Read <a href="https://github.com/voltrue2/gracenode/tree/develop/src/rpc#rpc-server">here</a>.

- Provides built-in **session** management as an option. Read <a href="https://github.com/voltrue2/gracenode/tree/develop/src/session#session">here</a>.

- Provides fast **template enigne**. Read <a href="https://github.com/voltrue2/gracenode/tree/develop/src/render#render">here</a>.

## Installation via npm

**NOTE:** If you are running your application as a daemon with older version of **gracenode**, please make sure to stop the daemon before installing the newer version.

`npm install gracenode`

## Add gracenode as your application's dependency

To install **gracenode** you can either add it to your package.json like so:

**Install From Git Repository**
```json
{
    "dependencies": {
        "gracenode": "git+https://github.com/voltrue2/gracenode.git#master"
    }
}
```

**Install From npm Repositiory**
```json
{
    "dependeicies": {
        "gracenode": "2.1.2"
    }
}
```

**Install From Git Without package.json**

`npm install git+https://github.com/voltrue2/gracenode.git#master`

## How To Use gracenode

In order to use **gracenode**, you need to properly set it up in your application root file (The file that starts your application).

## Create Boilerplate To Get Started

To create a basic setup for your application, execute the following command from the root of your application directory:

`./node_modules/gracenode/bin/boilerplate`

The above command will create a very basic setup for you. 

To start your own HTTP server from here on, execute `make start`.

The above command will daemonize your appliction and the daemon process will automatically restart if you change the application code or/and configurations.

**NOTE**: By default, your HTTP server will be listening to port `http://localhost:8888`.

#### How To Start Your Application

If you executed `./node_modules/gracenode/bin/boilerplate`, you now have `Makefile` in your application directory.

The following commands are now available:

- **Lint Your Javascript Files**: `make lint`

You may add more direcotries to lint in Makefile to lint additional files.

- **Start Application**: `make start`

- **Stop Application**: `make stop`

- **Restart Application**: `make restart`

- **Check Process Status**: `make status`

- **Reload Application**: `make reload`

#### Where is the configurations?

The configuration file(s) are located in `configs/`.

There is a symbolic link that points to `configs/config.json`.

This is the file that the application is reading from.

#### How To Add More Endpoints

To add more HTTP REST endpoints, add more routes to `api/index.js`.

You also need to create a route handler for the route(s) that you are adding.

**Example**:

```javascript
gn.http.get('/hello2', require('./controllers/hello2'));
```

#### How To Add More Views

To add more views, you must add new views to `api/views/index.js`.

You also need to add a view handler for your new view.

**Example**:

```javascript
modules.exports = {
	hello: require('./hello'),
	hello2: require('./hello2')
};
```

#### How To Add More Templates

In order to add more templates, you need to add template files to `templates/`.

The added template files must be read in your new view handlers.

See the example in `api/views/hello/index.js`.

### Configure Logging and Cluster Management

These are optional configurations, but you will want to know what they do.

```javascript
var gn = require('gracenode');

// Here the configurations are given as an object
gn.configure({
	lint: {
		// lint all application js files when starting. default is true
		enable: true,
		// a list of file names or file paths to ignore linting. default is empty
		ignore: [],
		// if this is set to true, lint error(s) will cause your application to terminate immediately. default is false
		strict: false
	log: {
		// default is false
		console: false,
		// default is false
		color: false,
		// default is undefined
		file: '/path/to/my/logging/dir/'
	},
	cluster: {
		// Maximum number of workers. default is 0
		max: 0
	},
	http: {
		// you must have this value if you need to use gracenode.http
		port: 8888,
		// you must have this value if you need to use gracenode.http
		host: 'localhost'
	},
	render: {
		// in order to use gracenode.render, you must provide this vakue
		path: '/path/to/templates/',
		// custom cache size for render engine. it is an option
		cacheSize: 5000000
	}
});

// Now start gracenode
gn.start(function () {
	// Your application is now ready!
});

```

**NOTE 1:** You may give the configurations as a JSON file also:

```javascript
gn.config(require('/path/to/my/config.json'));
```

**NOTE 2:** You may call `.config()` as many times a syou need to merge the configuration objects.

This is useful when you have shared common configurtions with other developers and your custom configrations for each.

#### Example:

```javascript
gn.config(require('/path/to/my/shared/config.json'));
gn.config(require('/path/to/my/custom/config.json'));
```

**NOTE 3:** More details for logging and cluster configurations will be given later in this <a href="https://github.com/voltrue2/gracenode#default-configurations">README</a>.

### Linting

gracenode lints your application code when `gracenode.start()` is called.

If **gracenode** detects a lint error, **gracenode** does not terminate immediately.

If, however, `lint: { strict: true }` is set, **gracenode** will terminate its process immediately on lint error(s).

**NOTE**: Uses `jshint` with the configurations below:

```
"jshintConfig": {
                "node": true,
                "bitwise": false,
                "camelcase": true,
                "curly": true,
                "eqeqeq": true,
                "forin": false,
                "immed": true,
                "latedef": false,
                "newcap": true,
                "noarg": true,
                "noempty": true,
                "undef": true,
                "unused": true,
                "nonew": true,
                "white": true,
                "maxdepth": 5,
                "quotmark": "single",
                "globals": {
                        "mocha": false,
                        "describe": false,
                        "it": false,
                        "before": false,
                        "beforeEach": false,
                        "after": false,
                        "afterEach": false
                }
        }
```

##### Strict Mode

If strict mode is set to `true`, your application process will terminate on start if lint error(s) is detected.

This is set to `false` by default.

**Example**:

```
{
	lint: {
		enable: true,
		strict: true
	}
}
```

##### How To Disable Lint

To disable **gracenode** liniting, add the following configuration to your application config.

```
lint: {
	enable: false
}
```

##### How To Ignore Certain Files/Directories For Lint

You may have **gracenode** ignore certain files/directories for liniting by adding the following in your application configuration:

```
lint: {
	ignore: [
		''
	]
}
```

##### How To Change Lint Configurations

In order to change lint configurations, add/change the following in your `package.json`:

```
"jshintConfig": {
                "node": true,
                "bitwise": false,
                "camelcase": true,
                "curly": true,
                "eqeqeq": true,
                "forin": false,
                "immed": true,
                "latedef": false,
                "newcap": true,
                "noarg": true,
                "noempty": true,
                "undef": true,
                "unused": true,
                "nonew": true,
                "white": true,
                "maxdepth": 5,
                "quotmark": "single",
                "globals": {
                        "mocha": false,
                        "describe": false,
                        "it": false,
                        "before": false,
                        "beforeEach": false,
                        "after": false,
                        "afterEach": false
                }
        }
```

## Start Your Application As A Daemon

There are 2 different ways to start your application as a daemon.

#### Example 1:

Assuming `app.js` is your appliction file to execute.

`node app.js start -l /path/to/my/daemon/logging/`

#### Example 2:

**gracenode** creates `./gracenode` executable when you install **gracenode**.

Assuming `app.js` is your appliction file to execute.

`./gracenode app.js start -l /path/to/my/daemon/logging/`

**NOTE:** More details on the daemonization command options will be explain later in this <a href="https://github.com/voltrue2/gracenode#daemon-commands">README</a>.

## Auto-Restarting Of Daemon Process

It is very useful when you are developing your application to automatically restart the running daemon on changes that your make.

To do so, you need to use a daemon command option `-w`.

#### Example:

`node app.js start -l /path/to/my/daemon/logging/ -w /path/to/my/app/code/ /path/to/my/another/ap/code`

**NOTE:** `-w` option watches the directories/files that are given and when there changes such as adding a new file, removing some files, and changing the existing file are detected,
daemon will automatically restart so that your changes are now in effect without having to manually restart your daemon.

## Bootstrapping other modules

Some modules require some setting up before they can be used in your code, some setup process maybe asynchronous and your application has to wait for it to complete its process.
When you use such modules, simply calling `var mod = require('great-mod');` is not good enough especially when the module requires asynchronous setup.

**gracenode** can bootstrap all of these modules and handle setting up of each module in an organized way.

For example, assuming this `foo` module needs to read some files before it is ready, **gracenode** can handle it like so:

```javascript
var gn = require('gracenode');

gn.use('foo', 'node_modules/foo', {
	setup: function (cb) {
		this.readFromFiles(cb);
	}
});

gn.start({
	// Now gracenode is ready
	// And foo is also ready
	// To access foo module:
	gn.mod.foo.doSomething();
});
```

**NOTE 1:** The 2nd argument of `.use()` is a relative path to load the module `foo`. The path is relative to the root path of your application.

**NOTE 2:** The 3rd argument is an optional object that you can assign specific functions to perform setting and/or cleaning.

**NOTE 3:** `this` inside of the functions you assign to the 3rd argument is the module you are "using". In this example, `this` is `foo` module.

**NOTE 4:** More details on `.use()` and its options will be explained later in this <a href="https://github.com/voltrue2/gracenode#usemodulename-string-modulepath-string-options-object">README</a>.

#### Accessing Bootstrapped Modules

**gracenode** has a property `.mod` that holds all bootrstapped modules. The first argument of `.use()` will be the name of bootstrapped module.

Here is how you would access the bootstrapped modules in your application code:

```javascript
var gn = require('gracenode');

gn.use('myModule', '/path/to/my/module/');

gn.start(function () {
	gn.mod.myModule.doSomething();
});
```

## Use gracenode With express Framework

**gracenode** can be used along side with <a href="https://www.npmjs.com/package/express" target="_blank">express</a>.

It will give your express application the support for clustering and daemoning out-of-the-box.

**Example**:

```javascript
var gn = require('gracenode');

gn.use('express', require('express'));

gn.start(function () {
	// start your express application
	var app = gn.mod.express();
	app.listen(8000);
});
```

## Properties

### .log

Logging module. For more details, please read <a href="https://github.com/voltrue2/gracenode#logging">here</a>.

### .lib

Library of built-in utility functions. For more details: <a href="https://github.com/voltrue2/gracenode#gracenodelib">here</a>.

### .render

Dynamic renderer for HTML and other contents to be served from the server.

For more details, please read <a href="https://github.com/voltrue2/gracenode#render-1">here</a>.

**Example**:

```javascript
gracenode.http.get('/', function (req, res) {
	var data = {
		title: 'Hello World'
	};
	var renderedHTML = gracenode.render('view/index.html', data); 
	res.html(renderedHTML);
});
```

### .http

An HTTP server router to help you build HTTP rest server.

For more details please read <a href="https://github.com/voltrue2/gracenode/tree/develop/src/http#http-router">here</a>.

#### Register Routings

To register HTTP endpoints, call the following functions.

#### Configurations

```
gracenode.config({
	http: {
		port: <number>,
		host: <string>
	}
});
```

#### gracenode.http.get(url [string], handler [function])

Registers a routing for GET requests.

**Example**:

```javascript
var gn = require('gracenode');
gn.config({
	http: {
		port: 8888,
		host: 'localhost'
	}
});
gn.http.get('/example', function (req, res) {
	res.json({ title: 'Hello World' });
});
gn.http.get('/mypage', require('/path/to/mypage/handler'));
```

<a href="https://github.com/voltrue2/gracenode#router-1">More Details Here</a>

### .session

**gracenode** comes with built-in session management for `HTTP`, `UDP`, and `RPC` server.

For more details read <a href="https://github.com/voltrue2/gracenode/tree/develop/src/session#session">here</a>.

### .udp

For real-time applications, **garcenode** comes with UDP server.

For more details read <a href="https://github.com/voltrue2/gracenode/tree/develop/src/udp#udp-server">here</a>. 

### .rpc

**gracenode** comes with RPC real-time application solution over TCP.

For more details read <a href="https://github.com/voltrue2/gracenode/tree/develop/src/rpc#rpc-server">here</a>.

### .cluster

**gracenode** manages cluster and communications between cluster nodes.

**gracenode** uses `cluster-mode` module to manage clustering and process to process communication.

More details is <a href="https://github.com/voltrue2/cluster-mode">HERE</a>.

## Methods

### .getRootPath()

Returns a application root path as a string.

### .config(configObj [object])

Set configurations as an object as an option.

This function can be called multiple times and it will merge all configuration objects being passed.

**NOTE**: The same configuration properties will be overwritten.

### .getConfig(configName [string])

Returns a matching configurations.

**Example**:

```javascript
var gn = require('gracenode');
gn.config({
	log: {
		file: '/path/to/log/dir/'
	}
});
var logFilePath = gn.getConfig('log.file');
```

### .onException(callback [function])

Assigns a function to be executed on `uncaughtException` event.

### .onExit(taskFunction [function])

Assigns a function to be executed on process exit of **gracenode**. The assigned function will have a callback function passed.

**Example**:

```javascript
gracenode.onExit(function (callback) {
	// do something before terminating the process
	callback();
});
```

### .require(path [string])

`gracenode.require()` requires a module from application root path.

Example:

```javascript
// application root: /var/www/myapp/
// module path: /var/www/my/myapp/mystuff/
// required location: /var/www/myapp/look/here/index.js
// without gracenode.require()
var mystuff = require('../../mystuff');
// with gracenode.require()
var mystuff = gracenode.require('mystuff');
```

#### Default Configurations

**gracenode** can be configured with the following properties by default:

```
{
	log: {
		rotationType: [string],
		useTimestamp: [boolean],
		bufferSize: [int],
		bufferFlushInterval: [int],
		oneFile: [boolean],
		file: [string],
		console: [boolean],
		remote: [object],
		color: [boolean],
		showHidden: [boolean],
		depth: [int],
		level: [string]
	},
	cluster: {
		max: [int],
		autoSpawn: [boolean],
		sync: [boolean]
	}
}
```

**NOTE**: To use configurations for bootstrapped module, simply use the same name as used in `.use()`.

##### log.rotationType

Defines log file rotation type.

The valid types are:

- `year`

- `month`

- `day`

- `hour`

Default is `day`,

##### log.useTimestamp

If `true`, the logging time will be in Unix timestamp.

Default is `false`.

##### log.bufferSize

Defines the buffer size for log data in bytes.

Default is 8128 bytes (8KB).

**NOTE**: File logging only.

##### log.bufferFlushInterval

Defines auto-buffer-flush interval in milliseconds.

Default is 5000ms (5 seconds).

**NOTE**: File logging only.

##### log.oneFile

If `true`, file logging will be combined in to one file for all log levels.

Default is `false`.

**NOTE**: File logging only.

##### log.file

Defines the path to the logging directory.

If this is not set, **gracenode** will NOT log to file, but stdout/stderr stream only.

Default is not set.

##### log.console

If `true`, all logging will be outputting to stdout/stderr stream.

Default is `true`.

##### log.remote

Defines the configurations to send logging data to a remote server via UDP protocol.

```
{
	host: [string],
	port: [int]
}
```

Default is not set.

##### log.color

If `true`, logging data will be colored.

Default is `false`.

##### log.showHidden

If `true`, logging objects will show hidden properties.

Default is `false`.

##### log.depth

Defines how far logging module should recursively output objects.

Default is not set.

##### log.level

Defines from which log level to output.

The valid log levels are:

- `verbose`

- `debug`

- `table`

- `trace`

- `info`

- `warn`

- `error`

- `fatal`

Use `>`, `>=` to control the definition of log level.

**Example**

```
'>= info'
```

The above example will be logging from log level info to lower (info, warn, error, fatal).

**NOTE**: From the top highest to lowest

##### cluster.max

Defines how many cluster worker processes.

If `0` is given, **gracenode** will not be running in cluster.

Default is `0`.

##### cluster.autoSpawn

If `true`, terminated worker processes will be automatically respawned and replaced.

Default is `false`.

##### cluster.sync

If `true`, all workers will share a list of existing workers and their `pid`.

This may lead to server stress.

Default is `true`.

### .use(moduleName [string], modulePath [string], options [object])

Tells **gracenode** to bootstrap and set up a given module.

**gracenode** will be loading the module from `modulePath`.

#### options [object]

Assigns an optional functions to be executed for the bootstrapped module.

**Structure**:

```
{
	config: [function],
	setup: [function],
	exit: [function]
}
```

##### options.config [function]

A function to be executed when starting the **gracenode** process to read configuration data.

The assigned function be will passed a configuration data.

**Example**

```javascript
gracenode.use('myMod', '/path/to/my/mod/', {
	config: function (configData) {
		this.configData = configData;
	}
});
```

**NOTE**: `this` in the function is the bootstrapped module.

##### .options.setup [function]

A function to be executed when starting the **gracenode** process after `options.config()` if provided.

If `options.config()` is not provided, it will be called at the start of bootstrapping the module.

The function will be passed a callback function.

**Example**

```javascript
gracenode.use('myMod', {
	setup: function (callback) {
		// do something here
		callback();
	}
});
```

**NOTE**: `this` in the function is the bootstrapped module.

##### .options.exit [function]

A function to be executed on exitting of the **gracenode** process.

It is useful to clean up before the exit.

The function will be passed a callback function.

**Example**
```javascript
gracenode.use('myMod', '/path/to/my/mod/', {
	exit: function (callback) {
		// do something here
		callback();
	}
});
```

**NOTE**: `this` in the function is the bootstrapped module.

### .start(callback [function]);

Starts the **gracenode** process.

**NOTE**: If there is an error while starting the process, it will crash with an exception.

### .stop(error [*error object])

Stops the running **gracenode** process.

If an error object is passed, it will stop the process with an error.

### .isMaster()

Returns `true` if the process is running in cluster and the process is a master process.

### .isCluster()

Returns `true` if the process is running in cluster.

## Logging

**gracenode** comes will built-in logging module.

It is accessed as `gracenode.log`.

### How To Log

In order to log some data, you need to create a logger.

```javascript
var logger = gracenode.log.create();
logger.verbose('I am logging something here');
logger.info({ example: 'Example Object' });
var loggerWithName = gracenode.log.create('my logger');
loggerWithName.warn('warning!');
```

#### .log.setPrefix(prefix [string])

Defines a prefix to each logging data.

#### .log.create(loggerName [*string])

Returns an instance of logger object.

#### Logger Class Methods

##### .verbose()

Log level `verbose`.

##### .debug()

Log level `debug`.

##### .table()

Log level `debug`.

##### .trace()

Log level `debug`.

##### .info()

Log level `info`.

##### .warn()

Log level `warn`.

##### .error()

Log level `error`.

##### .fatal()

Log level `fatal`.

#### Log Event

**gracenode** logger emits an even on each log output.

It is useful for capturing and sending all logging to a database etc.

##### output

```javasctipt
gracenode.log.on('output', function (ip, logName, level, messageObj) {
	// do something
});
```

## Daemon Commands

There are some command-line options available for daemon.

### Help

`node app.js --help`, `node app.js -h`, `./gracenode --help`, or `./gracenode -h`.

### Commands

#### start

Start an application as daemon.

`./gracenode start app.js`

`node app.js start`

#### stop

Stop a running application.

`./gracenode stop app.js`

`node app.js stop`

#### restart

Restart a running application.

`./gracenode restart app.js`

`node app.js restart`

#### reload

Gracefully restart a running application.

This command works ONLY if your are running the application in cluster mode.

`./gracenode reload app.js`

`node app.js reload`

#### stopall

Stop all running daemon applications.

`./gracenode stopall`

`node app.js stopall`

To ignore prompting, add an option `-f`.

`./gracenode stopall -f`

`node app.js stopall -f`

#### restartall

Restart all running applications.

`./gracenode restartall`

`node app.js restartall`

To ignore prompting, add an option `-f`.

`./gracenode restartall -f`

`node app.js restartall -f`

#### status

Output running status of a daemon.

`./gracenode status app.js`

`node app.js status`

#### list

Output all running status of daemons

`./gracenode list`

`node app.js list`

#### tail

Tails daemon log files.

`./gracenode tail app.js`

`node app.js tail`

### Options

#### -l, --log=[path]

Write log data into a file.

#### -e, --exec=[path]

Daemonize the target application with the given interpreter.

#### -w, -a

Automatically restart the daemon process if watch file(s) change.

#### -v, --verbose

Be more verbose.

#### -f

Stops or restarts all running daemon processes without user inputs. This option is for {stopall|restartall} command only.

***

## gracenode.lib

#### .now()

Returns a current timestamp in milliseconds just like `Date.now()`, but it calculates the value every second to avoid syscall `gettimeofday`.

The returned value may not be accurate. This is useful if you need to check the time in performance critical situation. Remember that you are sacrificing the accuracy.

#### .padNumber(num [number], digit [*number])

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

#### .getDates(startDate [object], endDate [object])

Returns an array of date objects between `startDate` amd `endDate`.

Example:

```javascript
var dates = gracenode.lib.getDates(new Date('2015-04-22'), new Date('2015-05-22'));
// dates will contain date objects between 2015/04/22 and 2015/05/22
```

#### .find(findFrom [object], findMethod [function])

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

#### .typeCast(value [string])

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

#### .randomInt(min [number], max [number])

Returns a pseudo-random integer between min and max.

#### .randomFloat(min [number], max [number])

Returns a pseudo-random floating point number between min and max.

The thrid argument "precision" is optional and default is 2.

#### .getArguments(func [function])

Returns an array of arguments that the given function expects.

```javascript

function foo(num1, num2) {
        return num1 + num2;
}

var args = gracenode.lib.getArguments(foo);
// args = ["num1", "num2"];
```

#### .walkDir(directoryPath [string], callback [function])

Recursively walks the given path and passes an array of file paths to the callback function.

#### .deepCopy(obj [object])

Returns a deep copied object. Use this function instead of `gracenode.lib.cloneObj()`.

#### .cloneObj(obj [object], propNames [array]) (Deprecated)

Returns a clone of given object. In javascript, objects are passed around as references. Use this in order to avoid mutating the original objects.

If propNames is given, the function will clone ONLY the properties given in propNames array.

#### .createTimedData(config [object])

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

### TimedData Class

#### .getValue()

Returns the current value.

#### .inc(incrementValue [number])

Increments the current value by incrementValue.

Returns `true` if successful.

#### .dec(decrementValue [number])

Decrements the current value by decrementValue.

Returns `true` if successful.

#### .reset()

Resets the state of `TimedData` object to its initial state.

#### .getMaxValue()

Returns maximum value.

#### .getMinValue()

Returns minimum value.

#### .getInterval()

Returns the interval for every update in milliseconds.

#### .getStep()

Returns the value of step for every update.

#### .toObject()

Returns a JSON format of `TimedData` object.

#### .createDateTime(time [*mix], defaultFormat [*string])

Returns an instance of DateTime object.

`time` can be a `YYYY-MM-DD HH:MM:SS` style string, javascript Date object, or timestamp such as `Date.now()`.

Example:

```javascript
var dt = gracenode.lib.createDateTime();
var fomratted = dt.format('m/d/Y H:M:S');
// e.g. 04/28/2015 21:13:09
```

## DateTime Object

### Methods

#### .format(format [*string])

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

#### Formatting rules

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

#### .offsetInDays(offset [number])

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
#### .offsetInHours(offset [number])

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

#### .now()

Returns a unix timestamp in milliseconds.

#### .getDaysInRange(date [mix])

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

#### gracenode.lib.uuid.v4()

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

#### gracenode.lib.uuid.create(input [mix])

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

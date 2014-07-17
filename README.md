#gracenode

©Nobuyori Takahashi < <voltrue2@yahoo.com> >

Framework for node.js application with extendable module management system for fast and clean development.

## Version 1.0.0

We have now released gracenode version 1.0.0.

There is a backward compatibility break in module system.

For more detail on gracenode modules, please read <a target="_blank" href="https://github.com/voltrue2/gracenode/blob/develop/CHANGELOG.md#version-100">here</a>.

Please see the list of gracenode modules on NPM repository <a target="_blank" href="https://www.npmjs.org/~voltrue2">here</a>.

##Installation

###Installation via NPM

`npm install gracenode`

###Add gracenode as your application's dependency

To install gracenode you can either add it to your package.json like so,

```
// Add gracenode from github repo
{
    "dependencies": {
        "gracenode": "git+https://github.com/voltrue2/gracenode.git#master"
    }
}
// Or add gracenode from npm repo
{
	"dependeicies": {
		"gracenode": "0.2.2"
	}
}
```
or NPM install directly via `npm install git+https://github.com/voltrue2/gracenode.git#master`.

###Creating configuration files

In your root directory create a directory that is called 'configs'. Although you can name it whatever you want, for this instruction we have named our directory configs.

<pre>
$ mkdir configs/
$ touch configs/conf.json
</pre>

Refer to each module's README.md for more detail on configurations.

##Bootstrapping gracenode

To use gracenode modules, add the following to your package.json:

```
// we are using gracenode-server, gracenode-view, and gracenode-mysql modules
{
	"dependencies": {
		"gracenode": "",
		"gracenode-server": "",
		"gracenode-view": "",
		"gracenode-mysql": ""
	}
}
```

gracenode needs to be set up for it to run correctly. In your application add:

```
var gracenode = require('gracenode');
//Set the configuration path.
gracenode.setConfigPath('configs/');
//Add configuration files that need to be loaded.
gracenode.setConfigFiles(['conf.json']);

// decide what module(s) of gracenode to use in your application.
gracenode.use('gracenode-server');
gracenode.use('gracenode-view');
gracenode.use('gracenode-mysql');

// now start the set up process
gracenode.setup(function (error) {
    if (error) {
        throw new Error('gracenode failed to set up: ' + error);
    }
    // gracenode is ready to go

});
```

##How to start your gracenode application

To start your application, simply execte your bootstrapped file as shown below:

```
node yourBootstrapped.js
```

##Daemonizing your application process

gracenode framework comes with daemon tool to daemonize your application out-of-the-box.

gracenode creates a script called `daemon` in your application root when you install it via npm.

Main focus of daemon tool is to allow your gracenode daemon application to exit gracefully instead of killing the processes.

In order to use daemon tool, your application does NOT have to be built with gracenode framework.

Daemon tool of gracenode can daemonize ANY node.js application.

To start your application as a daemon process:

```
node daemon start
```

To stop your daemon application:

```
node daemon stop
```

To restart your daemon application:

```
node daemon restart
```

To list the currently running daemon processes:

```
node daemon list
```

You can optionally give a path to the application you want to target.

```
node daemon start /path/to/your/app/
```

```
node daemon stop /path/to/your/app/
```

```
node daemon restart /path/to/your/app/
```

### Logging

Daemon tool can leave log data in files as an option.

To enable logging, execute:

```
node daemon start /path/to/your/app/ --log=/path/to/your/logs/
```

### Help

To display help interface:

```
node daemon --help
```

***

#gracenode

##Methods

###.argv(argumentName [string])

Returns true or a value associated to the key given as an argument.

Example:

```
node myGracenodeApp/ -t -y good  --hello=world

// in your application:
var value = gracenode.argv('-t');
// this will return true.
var value = gracenode.argv('-y');
// this will return 'good'.
var value = gracenode.argv('--hello');
// this will return 'world'.
```

Combined options Example:

```
node myGracenodeApp/ -abc

// in your application
-abc is equivalent to -a -b -c
var a = gracenode.argv('-a');
// true
var b = gracenode.argv('-b');
// true
var c = gracenode.argv('-c');
// true
```

```
node myGracenodeApp/ -p aaa bbb ccc

// in your application
var p = gracenode.argv('-p');
// ['aaa', 'bbb', 'ccc']
```

###.defineOption(argumentName [string], description [srting], optionExecution [*function])

Defines an option and add short description for `--help` and function to be executed if the option is given.

Example:

```
// node myGracenodeApp/ --test=1234

gracenode.defineOption('--test', 'Test option description', function (value) {
	// value is 1234
	// do something
});
```

### --help

gracenode has --help option and displays defined command options set by `.defineOption()`.

###.setConfigPath(configDirectoryPath [string])
Tells gracenode where to find the configuraitons files.
```
gracenode.setConfigPath('configs/');
```

###.setConfigFiles(configFileList [array])
Give gracenode the list of configuration files to be used. The files must be in the directory given to setConfigFiles.
```
gracenode.setConfigFiles(['conf.json']);
```

###.registerShutdownTask(taskName [string], task [function]);
Registers a function to be executed when gracenode process is shutting down to ensure graceful exit of the application
```
gracenode.registerShutdownTask('example', function (callback) {
	// handle graceful tasks here
	// we are done
	callback();
});
```

###.addModulePath(modulePath [string])
Adds a module path for gracenode to load modules from. Used to load external gracenode module
```
gracenode.addModulePath('mymodules/');
gracenode.use('mymodule');
```

###.use(moduleName [string], options [*object])

Tells gracenode what modules to load when calling the setup functions.

```
gracenode.use('mysql');
gracenode.use('myModule');
```

With the optional second argument, you can give the module an alternate name.

```
gracenode.use('mysql', { name: 'mysql2' });
// accessing this module will be gracenode.mysql2
```

Also if you are using 3rd party node module as gracenode module, you can apply a driver to that module by:

```
gracenode.use('async', { name: 'async2', driver: { config: <*function>, setup: <*function>, shutdown: <*function>, expose: <*function> } });
```

For more details on module drivers, please read <a href="#module-drivers">here</a>.

###.setup(callback [function])
Start the setting up of gracenode modules.
```
gracenode.setup(function(error) {
    if (error) return console.error('Could not load gracenode:', error);
});
```

###.isMaster()
Returns a boolean. true is given if the process is master (available ONLY in cluster mode)

###.getProcessType()
Returns an object that contains the type of process as a string and pid. (available ONLY in cluster mode)
```
var processType = gracenode.getProcessType();
/*
{ type: 'master', pid: 1240 } or { type: 'worker', pid: 36204 }
*/
```

###.exit(errorMessage [string*])
Exits gracenode and attempts to gracefully shutdown the process. You can give it an error message in case you want to stop the process due to an error.
```
gracenode.exit('financialCrisis');
```

###.getRootPath()
Returns the root path of the application (not the root path of gracenode)
```
var appRoot = gracenode.getRootPath();
```

###.require()
Executes nodejs native require with application root path as prefix. You do not have to go ../../mydir/me.js
```
var mymod = gracenode.require('mydir/mymod');
```

###.getModuleSchema(moduleName [string], callback [function])
Finds and returns an array of schema SQL queries (only for modules with schema.sql file in the directory)
```
gracenode.getModuleSchema('gracenode-wallet', function (error, sqlList) {
	// execute queries	
});
```

##Events
Gracenode has the capabilities to emit events, you can catch these events using:
```
gracenode.on('event.name', yourEventHandler);
```
###setup.config
Emitted when the config module has been set up.
###setup.log
Emitted when the log module has been setup.
###setup.complete
Emitted when the setup has been completed.
###setup.moduleName
Emitted when a specific module has been setup.
###uncaughtException
Emitted when gracenode caught an uncaught exception.
###exit
Emitted when gracenode exits.
###shutdown.taskName
Emitted when gracenode's module finished executing shutdown task.
###shutdown
Emitted when gracenode detects SIGINT. This is before exit is emitted.

#Cluster Mode
Spawns forked process(es) if allowed
###Configurations
```javascript
"cluster": {
	"enabled": <boolean>
	"max": <integer> // number of maximum child processes allowed
	"autoSpawn": <boolean> // if true, the application will auto-respawn dead child process
}
```

***

#Modules

gracenode framework is modular. And it allows you to extend it by adding your custom modules and/or 3rd party node modules.

### Loading modules from your application locally

If you have modules that you wish to use, but they are not packaged, gracenode will let you use those modules by:

```
var gracenode = require('gracenode');
gracenode.addModulePath('path/to/your/modules/directory/');
gracenode.use('moduleNameYouWantToUse');
```

### Loading modules as dependencies of your application

If you wish to use modules that are available from NPM or git repositories, gracenode handles them by:

Add the modules as your dependencies in package.json.

```
"dependencies": {
	"gracenode": "",
	"gracenode-server": "",
	"gracenode-mongodb": ""
}
```

Then use the modules.

```
var gracenode = require('gracenode');
gracenode.use('gracenode-server');
gracenode.use('gracenode-mongodb');
```

***

#Default Modules
By default gracenode automatically loads the following modules. Click on the link to read more about them.
###[Config](modules/config)
Handles everything config related.
###[Log](modules/log)
Takes care of logging.
###[Profiler](modules/profiler)
Used to profile your application so you can easily determine bottlenecks in your application.
###[Lib](modules/lib)
Contains a plethora of commonly used functions like random integer generation.
#Additional Modules
These modules are specifically designed to function as gracenode modules.
###[gracenode-cron](https://github.com/briandeheus/gracenode-cron)
Module to run, start, stop, and setup cron tasks
###[gracenode-staticdata](https://github.com/voltrue2/gracenode-staticdata)
Allows for easy loading of static data such as JSON and CSV files.
###[gracenode-request](https://github.com/voltrue2/gracenode-request)
Handles requests to the server.
###[gracenode-server](https://github.com/voltrue2/gracenode-server)
Handles requests to the server.
###[gracenode-udp](https://github.com/voltrue2/gracenode-udp)
A module that makes it easier to handle UDP traffic from and to your server.
###[gracenode-view](https://github.com/voltrue2/gracenode-view)
Manages, loads and creates views you can server to clients.
###[gracenode-session](https://github.com/voltrue2/gracenode-session)
Handles sessions and automatically expires them if they are not accessed within a preset amount of time.
###[gracenode-encrypt](https://github.com/voltrue2/gracenode-encrypt)
Contains functions that make it easier to deal with crypography and password hashing.
###[gracenode-mysql](https://github.com/voltrue2/gracenode-mysql)
A wrapper to handle MySQL connections without the hassle of maintaining your connection pool.
###[gracenode-mongodb](https://github.com/voltrue2/gracenode-mongodb)
A wrapper to handle Mongodb functions and connections.
###[gracenode-memcache](https://github.com/voltrue2/gracenode-memcache)
Memcache management.
###[gracenode-iap](https://github.com/voltrue2/gracenode-iap)
Apple and GooglePlay in-app-purchase validation.
###[gracenode-wallet](https://github.com/voltrue2/gracenode-wallet)
Coin management.

***

### How to Write Your Custom Module for gracenode

gracenode allows you to add your own modules and use them like built-in modules.

The configuration objects are read from configuration JSON file(s). The name for the module configurations MUST match the name of the module.
```
"modules": {
	"awesome": {
		// configurations for module called awesome
	}
}
``` 

#### .readConfig(configurations [object])

An optional function for your module to receive configuration object on process start.

Example:

```javascript
// module location myapp/mymodules/awesome/index.js
module.exports.readConfig = function (configurations) {
	// store this in memory and use it later
	config = configurations;
};
```

***

### How to Use Your Favorite Node Module with gracenode

gracenode has a way to integrate with 3rd party node modules as its own modules.

To add your favorite modules, in your package.json add:

```
{
	"dependencies": {
		"gracenode": "",
		"my-favorite-module": ""
	}
}
```

To use your favorite module, in your bootstrap code, add:

```
var gracenode = require('graceode');
// this will tell gracenode to load this module as its module
gracenode.use('my-favorite-module');
// to access the loaded modue
gracenode.myFaivoriteModule
```

Notice the hyphened module name was transformed to camel-cased name.

gracenode automatically transforms hyphened names to camel-cased name.

To load your module with alternative name:

```
var gracenode = require('graceode');
// this will tell gracenode to load this module as its module
gracenode.use('my-favorite-module', { name: 'myFav' });
// to access the loaded modue
gracenode.myFav
```

Now some modules need to be set up and prepared before they are ready to be used,

gracenode has a way to make sure your favorite modules are ready when you access them.

We will be talking about "module drivers" below to explain how gracenode does it.

***

### Module Drivers

A module driver is an object to be applied to a 3rd party node module to make it behaive as gracenode module.

Example:

```
// a driver for redis module
/app/drivers/redis/index.js
```

```
// what is inside redis module driver
var config;
var clients = {};

// gracenode will assign the module object to this
exports.module = null;

// an optional function to load configurations on gracenode.setup
exports.config = function (configIn) {
	if (!configIn.clients) {
		throw new Error('invalid configurations given:\n' + JSON.stringify(configIn));
	}
	config = configIn;
};
// an optional asynchronous function to be exected on gracenode.setup
exports.setup = function (cb) {
	for (var name in config.clients) {
		clients[name] = exports.module.createClient(config.clients[name].port, config.clients[name].host, config.clients[name].options);
	}
	cb();
};
// an optional function to register shutdown task to gracenode
exports.shutdown = function (gracenode, done) {
	// do your clean up here
	done();
};
// an optional function to let you decide how you want to expose the module
exports.expose = function () {
	// this function MUST return a module object
	// here we are exposing redis clients as redis module
	return clients;
};
```

***

### Using Your Custom Modules (module loading system)

gracenode allows you to add your custom modules to be loaded and used the same way as built-in modules.

To use your custom modules, add `gracenode.addModulePath('yourModuleDir/')` before you call `gracenode.setup`.

```javascript
// yourAwesomeModule is located at yourApp/yourModuleDir/yourAwesomeModule/
gracenode.addModulePath('yourModuleDir/');
gracenode.use('yourAwesomeModule');
```

***

## Building a Web Server

gracenode-server module allows you to create and run either HTTP or HTTPS server.

For more details about server module please read <a target="_blank" href="https://github.com/voltrue2/gracenode-server">here</a>.

#### How to add gracenode-server module to your application

Add the following in your package.json

```
"dependencies": {
	"gracenode": ">= 1.0.0",
	"gracenode-server": "0.1.10"
}
```

#### How to tell gracenode to use server module

```javascript
// this is your application index.js
var gn = require('gracenode');

// tell gracenode where to look for configuration file(s)
// gracenode always looks from the root path of your application
gn.setConfigPath('configurations/');

// tell gracenode which configuration file(s) to load
gn.setConfigFiles(['config.json']);

// tell gracenode to load server module
gn.use('gracenode-server');

gn.setup(function (error) {
    if (error) {
        return console.error('Fatal error on setting up gracenode');
    }
    
    // gracenode is now ready
    // start the server
    gn.server.start();
    
});
```

#### How to configure gracenode-server module

Please refer to <a target="_blank" href="https://github.com/voltrue2/gracenode-server">server module README</a> for more details.

```
// this the minimum requirements for server module to run
{
    "modules": {
        "gracenode-server": {
            "protocol": "http",
            "host": "localhost",
            "port": 8000,
            "controllerPath": "controller/"
        }
    }
}
```

#### How to create your "Hello World" page

Assuming that you are using configurations like the above, we can create our "Hello World" controller in:

`yourapp/controller/helloworld/`

Let's assume that our URL for "Hellow World" page would be "http://yourapp.com/hellowworld/sayhello".

Server module translates the above URL to be like this:

"helloworld" after the domain is interpreted to be the controller directory as `yourapp/controller/helloworld/`.

"sayhello" is your actual controller and it would be assumed to be `yourapp/controller/helloworld/sayhello.js`.

#### Add the controller logic to sayhello.js

We will assume that this URL will be a GET request.

```javascript
// this is what's inside sayhello.js
// server controller will always recieve a request object and response object on each request
// notice that we specifically say "GET". this is telling server module to handle GET request only.
module.exports.GET = function (request, response) {
    // since there isn't much to do, we will send the response back to the client right away
    response.html('<h1>Hello World</h2>');
};

```

### More Advanced Features

There are more complex things you can do with server module. For example rerouting is one of them.

#### How to reroute a URL to a specific controller and its method

Assume we want to have a URL like this "http://yourapp.com/helloworld".

But we want to execute `yourapp/controller/helloworld/sayhello.js` for this URL.

This kind of rerouting can be achieved by setting "reroute" in the configurations.

```
{
    "modules": {
        "gracenode-server": {
            "protocol": "http",
            "host": "localhost",
            "port": 8000,
            "controllerPath": "controller/",
            "reroute": [
                { "from": "/", "to": "helloworld/sayhello" }
            ]
        }
    }
}
```

Notice we have a new configuration object called "reroute" in the above configurations.

This configuration allows server module to execute `helloworld/sayhello.js` when the server receives a reuqest to "http://yourapp.com/helloworld".

#### Assign uniformted error controllers on specific error status

Server module also allows you to pre-define controllers to be executed on specific errors.

For example if your want to display a certain page for "404 Not Found" error, we can assign a specific controller and method for it.

```
{
    "modules": {
        "gracenode-server": {
            "protocol": "http",
            "host": "localhost",
	    "port": 8000,
            "controllerPath": "controller/",
            "reroute": [
                { "from": "/", "to": "helloworld/sayhello" }
            ],
            "error": {
                "404": {
                    "controller": "error",
                    "method": "notFound"
                }
            }
        }
    }
}
```

Notice we have a configuration object called "error" in the above configurations.

This tells server module to execute `yourapp/controller/error/notFound.js` on HTTP status 404.

#### Request Hooks

Server module can let you assign certain function(s) to be executed on requests.

This is usefuly for session validation on requests etc.

Example:

```
gracenode.setup(function () {

	// assign session validation function to all requests under "example" controller
	gracenode.server.setupRequestHooks({
		example: function (request, callback) {
			if (isSessionValid()) {
				// session is valid. continue to execute the request
				return cb();
			}
			// session is not valid. respond with error
			cb({ code: 'invalidSession' }, 403);
		}
	});
});
```

For more detailed information on request hooks, please read server module's README file.

***

# Unit Test

Gracenode offers unit tests for its built-in modules.

Currently available tests are:

```
// tests setting up of gracenode with gracenode mudles.
// You need to have gracenode modules installed in the same directory as gracenod for this test to work.
make test
```

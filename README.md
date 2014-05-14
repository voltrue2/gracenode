gracenode
©2013 - 2014 Nobuyori Takahashi < <voltrue2@yahoo.com> >

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

gracenode needs to be set up for it to run correctly. In your application add:

```
var gracenode = require('gracenode');
//Set the configuration path.
gracenode.setConfigPath('configs/');
//Add configuration files that need to be loaded.
gracenode.setConfigFiles(['conf.json']);

// decide what module(s) of gracenode to use in your application.
gracenode.use('server');
gracenode.use('view');
gracenode.use('mysql');

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

Gracenode does NOT include daemonization tool as there are numbers of options available for such task.

***

#gracenode

##Methods

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

###.override(moduleName [string])
Allows the application to override and use custom module of the same module name instead of the built-in module from gracenode
```
// this will load and use the custom module called "mysql"
gracenode.override('mysql')
```

###.use(moduleName [string], params [object*])
Tells gracenode what modules to load when calling the setup functions.
```
gracenode.use('mysql');
gracenode.use('myModule');
```

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
gracenode.getModuleSchema('wallet', function (error, sqlList) {
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
###shutdown
Emitted when gracenode detects SIGINT. This is before exit is emitted.

#Cluster Mode
Spawns forked process(es) if allowed
###Configurations
```javascript
"cluster": {
	"enabled": <boolean>
	"max": <integer> // number of maximum child processes allowed
}
```

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
###[Cron](modules/cron)
Module to run, start, stop, and setup cron tasks
###[StaticData](modules/staticdata)
Allows for easy loading of static data such as JSON and CSV files.
###[Request](modules/request)
Handles requests to the server.
###[Server](modules/server)
Handles requests to the server.
###[UDP](modules/udp)
A module that makes it easier to handle UDP traffic from and to your server.
###[View](modules/view)
Manages, loads and creates views you can server to clients.
###[Session](modules/session)
Handles sessions and automatically expires them if they are not accessed within a preset amount of time.
###[Encrypt](modules/encrypt)
Contains functions that make it easier to deal with crypography and password hashing.
###[MySQL](modules/mysql)
A wrapper to handle MySQL connections without the hassle of maintaining your connection pool.
###[Mongodb](modules/mongodb)
A wrapper to handle Mongodb functions and connections.
###[Memcache](modules/memcache)
Memcache management.
###[Iap](modules/iap)
Apple and GooglePlay in-app-purchase validation.
###[Wallet](modules/wallet)
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

#### .setup(callback [function])

An optional function for your module to be executed on process start.

Useful when your module needs to pre-process something before the application is ready.

Example:

```javascript
// setup function is asynchronus. Be sure to call the callback function when you are done.
module.exports.setup = function (callback) {
	// we are working magic here...
	// all done!
	callback();
};
```

### Using Your Custom Modules

gracenode allows you to add your custom modules to be loaded and used the same way as built-in modules.

To use your custom modules, add `gracenode.addModulePath('yourModuleDir/')` before you call `gracenode.setup`.

```javascript
// yourAwesomeModule is located at yourApp/yourModuleDir/yourAwesomeModule/
gracenode.addModulePath('yourModuleDir/');
gracenode.use('yourAwesomeModule');
```

***

## Building a Web Server

gracenode has a built-in module called "server". This module allows you to create and run either HTTP or HTTPS server.

For more details about server module please read <a target="_blank" href="https://github.com/voltrue2/gracenode/tree/master/modules/server">here</a>.

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
gn.use('server');

gn.setup(function (error) {
    if (error) {
        return console.error('Fatal error on setting up gracenode');
    }
    
    // gracenode is now ready
    // start the server
    gn.server.start();
    
});
```

#### How to configure server module

Please refer to <a target="_blank" href="https://github.com/voltrue2/gracenode/tree/master/modules/server">server module README</a> for more details.

```
// this the minimum requirements for server module to run
{
    "modules": {
        "server": {
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
        "server": {
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
        "server": {
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
// tests setting up of gracenode and all module tests (Exception for iap module test)
make test
// tests iap module (apple purchase test)
make test-iap-apple path=/path/to/receipt/sample/file
// tests iap module (google purchase test)
make test-iap-google key=/path/to/public/key/directory path=/path/to/receipt/sample/file
// test individual module
make test-module module=module name
```

***

### Using gracenode With Apache

If you insist using Apache with node.js... here is a simple apache configuration example.

```
# proxy to nodejs process
<VirtualHost *:80>
    ServerAdmin yourname@yourdomain.com
    DocumentRoot /var/www/yourdomain.com/htdocs
    ServerName yourdomain.com

    ProxyRequests off

    <Proxy *>
        Order deny,allow
        Allow from all
    </Proxy>

    ProxyPreserveHost on
    ProxyPass / http://yourdomain.com:8000/ # proxy everything else to gracenode
    ProxyPassReverse / yourdomain.com:8000/

</VirtualHost>
```


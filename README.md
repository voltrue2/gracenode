Node
©2013 - 2014 Nobuyori Takahashi < <voltrue2@yahoo.com> >

##Installation

###Installation via NPM

To install GraceNode you can either add it to your package.json like so,

```
{
    "dependencies": {
        "GraceNode": "git+https://github.com/voltrue2/GraceNode.git#master"
    }
}
```
or NPM install directly via `npm install git+https://github.com/voltrue2/GraceNode.git#master`.

###Creating configuration files

In your root directory create a directory that is called 'configs'. Although you can name it whatever you want, for this instruction we have named our directory configs.

<pre>
$ mkdir configs/
$ touch configs/conf.json
</pre>

Refer to `example-config.json` for an example configuration file.

##Bootstrapping GraceNode

GraceNode needs to be set up for it to run correctly. In your application add:

```
var gracenode = require('GraceNode');
//Set the configuration path.
gracenode.setConfigPath('configs/');
//Add configuration files that need to be loaded.
gracenode.setConfigFiles(['conf.json']);

// decide what module(s) of GraceNode to use in your application.
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
#Gracenode
##Methods

###.setConfigPath(configDirectoryPath [string])
Tells GraceNode where to find the configuraitons files.
```
gracenode.setConfigPath('configs/');
```

###.setConfigFiles(configFileList [array])
Give GraceNode the list of configuration files to be used. The files must be in the directory given to setConfigFiles.
```
gracenode.setConfigFiles(['conf.json']);
```

###.registerShutdownTask(taskName [string], task [function]);
Registers a function to be executed when GraceNode process is shutting down to ensure graceful exit of the application
```
gracenode.registerShutdownTask('example', function (callback) {
	// handle graceful tasks here
	// we are done
	callback();
});
```

###.addModulePath(modulePath [string])
Adds a module path for GraceNode to load modules from. Used to load external GraceNode module
```
gracenode.addModulePath('mymodules/');
gracenode.use('mymodule');
```

###.allowOverride(moduleName [string])
Allows the application to override and use custom module of the same module name instead of the built-in module from GraceNode
```
gracenode.allowOverrid('mysql')
```

###.use(moduleName [string], params [object*])
Tells GraceNode what modules to load when calling the setup functions.
```
gracenode.use('mysql');
gracenode.use('myModule');
```

###.setup(callback [function])
Start the setting up of GraceNode modules.
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
Exits GraceNode and attempts to gracefully shutdown the process. You can give it an error message in case you want to stop the process due to an error.
```
gracenode.exit('financialCrisis');
```

###.getRootPath()
Returns the root path of the application (not the root path of GraceNode)
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
Emitted when GraceNode caught an uncaught exception.
###exit
Emitted when GraceNode exits.
###shutdown
Emitted when GraceNode detects SIGINT. This is before exit is emitted.

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
By default GraceNode automatically loads the following modules. Click on the link to read more about them.
###[Config](modules/config)
Handles everything config related.
###[Log](modules/log)
Takes care of logging.
###[Profiler](modules/profiler)
Used to profile your application so you can easily determine bottlenecks in your application.
###[Lib](modules/lib)
Contains a plethora of commonly used functions like random integer generation.
#Additional Modules
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
###[Memcache] (modules/memcache)
Memcache management.
### [Iap] (modules/iap)
Apple and GooglePlay in-app-purchase validation.
### [Wallet] (modules/wallet)
Coin management.

### Useing GraceNode With Apache
> apache configuration example

```xml
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
    ProxyPass / http://yourdomain.com:8000/ # proxy everything else to GraceNode
    ProxyPassReverse / yourdomain.com:8000/

</VirtualHost>
```


# Change Log

## Version 1.0.3

## Added

None

## Changed

#### Improved profiler module set up in core index

#### Removed redundant configuration call for log module in core index

#### Improved error catching of module driver .expose()

## Depricated

None

## Removed

None

***

## Version 1.0.2

## Added

None

## Changed

#### Core module has removed the remaining override logic

#### Core module improved module name conflict checks

#### Core module loading simplified and performace improved

#### Core driver expose has been fixed

## Depricated

None

## Removed

None

***

## Version 1.0.1

## Added

None

## Changed

#### Unit test updated

To execute the unit test, execute the following:

`make test`

The test requires that you have all gracenode modules installed in the same directory as your gracenode.

## Depricated

None

## Removed

#### gracenode.override() removed

The depricated (version 0.3.0) gracenode method .override() has now been removed from this version.

***

## Version 1.0.0

# Backward compatibility break

Gracenode framework has removed all internal additional modules.

In order to use the former built-in modules, you will need to add them to your package.json as dependencies:

```
"dependencies": {
	"gracenode": "1.0.0",
	"gracende-server": "0.1.8",
	"gracenode-view": "0.1.2"
}
```

Here is the list of additional modules for gracenode:

These modules can be installed from NPM.

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

### Log module, Profile module, and Lib module are still part of gracenode framework.

## Changed

#### Log module performance improved

Log module's auto flushing on gracenode exit is now centralized for better performance.

***

## Version 0.3.14

### Added

#### Log module added a new method

Log module now has a method called "forceFlush". 

this method will force the log data buffer to flush the log buffer and write immediately.

### Changed

None

### Depricated

None

### Removed

#### Built-in server module's unit test removed.

We removed the test for built-in server module. gracenode-server module package now has the test instead.

#### Built-in view module's unit test removed.

We removed the test for built-in view module. gracenode-view module package now has the test instead.

#### Built-in mongodb module's unit test removed.

We removed the test for built-in mongodb module. gracenode-mongodb module package now has the test instead.

#### Built-in staticdata module's unit test removed.

We removed the test for built-in staticdata module. gracenode-staticdata module package now has the test instead.

#### Built-in iap module's unit test removed.

We removed the test for built-in iap module. gracenode-iap module package now has the test instead.

#### Bug fix in core/index.js

The bug in SIGINT, SIGQUIT, and SIGTERM exit fails has been fixed.

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.13, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.13

### Added

None

### Changed

#### Log module buffer flush interval fixed

Log module's optional configuration "bufferFlushInterval" is no longer undefined.

### Depricated

None

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.13, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.11

### Added

None

### Changed

#### Critical buf fix in log module's file and remote

The bug in log module's file write and remote send has been fixed.

### Depricated

None

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.11, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.10

### Added

None

### Changed

#### log module's event now passes an array of buffered log data

Log module's event "output" now passes an array of buffered log data which contains messages and timestamps.

#### config module error handling improved

Config module now handles error on invalid configurations and configurations not found better.

#### core module loader check improved

Core's module loader checks for module configurations not found error now handles the error before the module.

### Depricated

None

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.10, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.9

### Added

None

### Changed

#### log module's  timed-auto-buffer-flush improved

Minor improvements in timed-auto-buffer-flush. Now the autoFlush waits for the previous operation to finish.

### Depricated

#### additional built-in modules

Additional modules to be separated from gracenode core are now depricated.

Modules to be separated:

- server
- view
- mysql
- mongodb
- mysql
- memcache
- encrypt
- staticdata
- session
- request
- cron
- iap
- udp
- wallet

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.9, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.8

### Added

None

### Changed

#### bug fix on log module auto flushing

"The log module's timer based auto-flush stops flushing automatically" has been fixed.

### Depricated

None

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.8, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.7

### Added

None

### Changed

#### improved log module buffering

Log module's auto buffer flushing is improved.

### Depricated

None

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.7, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.6

### Added

None

### Changed

#### log module buffering

Log module now buffers log data and flushes to file/remote/event when buffer is full.

It also flushes the log data at every x seconds.

### Depricated

None

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.6, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.5

### Added

None

### Changed

#### core driver improved checks

### Depricated

None

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.5, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.4

### Added

None

### Changed

#### staticdata module CSV parser bug fix

Escaped values are now correctly parsed

### Depricated

None

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.4, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.4

### Added

None

### Changed

#### staticdata module CSV parser bug fix

Escaped values are now correctly parsed

### Depricated

None

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.4, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.3

### Added

None

### Changed

#### staticdata module CSV parser bug fix

Staticdata module's CSV parser fixed for parsing data with repeated commans in a single line.

### Depricated

None

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.3, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.2

### Added

#### unit test added path finder

### Changed

None

### Depricated

None

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.2, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.1

### Added

None

### Changed

#### Deleted driver search log from module management to driver managent

#### gracenode-server module (v0.1.1) added support for HEAD request method

Built-in server module has also added the change.

#### gracenode-request module (v0.1.1) added support for HEAD request method

Built-in request module also added the change.

#### unit test

An issue with gracenode path has been solved.

### Depricated

None

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.1, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.0

### Added

#### module driver system

To allow 3rd party node modules to behave as gracenode modules.

#### Changed

None

### Depricated

#### built-in module system

Current built-in modules will be removed from gracenode and will be available on NPM repo as gracenode modules.

#### gracenode.override

Because gracenode.use() function now allows you to change the name of modules, gracenode.override has lost its purpose.

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.0, we still have the current module system and the new driver system.

***

## Version 0.2.43

### Added

None

### Changed

#### iap module for google performance improvement

Iap module for google now reads public key file on setup of gracenode for better performance.

#### server module added multipart support

Server module can now handle request body with multipart header properly

### Depricated

None

### Removed

None

## Version 0.2.42

### Added

None

### Changed

#### server module refactored

Server module has been refactored for better performance.

#### lib module randomFloat bug fix

If you pass float numbers smaller than 1, the function had a chance of returning greater than max given.

### Depricated

None

### Removed

None

***

## Version 0.2.41

### Added

#### new unit test added to server module

Test for pre-defined 404 error handling has been added.

### Changed

None

### Depricated

None

### Removed

None

***

## Version 0.2.40-b

Changes for version 0.2.40-b

### Added

None

### Changed

#### server module pre-defined error handling bug fix

Server module's pre-defined error handling on 404 had an issue of not correctly executing the assigned error controller.

Now this issue has been fixed.

### Depricated

None

***

### Removed

None

***

## Version 0.2.40-a

Changes for version 0.2.40-a

### Added

None

### Changed

#### server module's router for "not found"

Server module's router now correctly uses the property in parsed URL object for not found 404 error.

### Depricated

None

***

### Removed

None

***

## Version 0.2.40

Changes for version 0.2.40

### Added

None

### Changed

#### lib mdodule random function improved

Lib module's randomInt and randomFloat improved their random logic for better performance and better randomness.

#### server module routing and contorller management

Performance of router and controller management improved.

### Depricated

None

### Removed

#### Depricated function gracenode.allowOverride is now removed

gracenode.allowOverride function has been depricated since version 0.2.30 in favor of gracenode.override and now it has been removed.

## Version 0.2.39

Changes for version 0.2.39

### Added

None

### Changed

#### server module: new response method added. response.download

A new method download added for file downloads.

Example: 

```
var csvData = 'colum A,column B\nAAA,BBB\nCCC,DDD';
response.download(csvData, 'example.csv');
```

#### server module corrected mime type of json response

#### gracenode core module loader improved

### Depricated

None

### Removed

None

## Version 0.2.38

Changes for version 0.2.38

### Added

None

### Changed

#### server module: auto look-up of index.js method

Server module will now look for index.js if there is no method name in the request URLs.

#### view module no longer remove tabs and line breaks from HTML files

View module no longer removes tabs and line breaks from HTML files.

#### unit test added for view module

View module now has unit test.

`make test-module module=view` or `make test`

#### view module now handles a new file extension .tpl

For more details please read viuew module README.

### Depricated

None

### Removed

None

***

## Version 0.2.37

Chages for version 0.2.37

### Added

#### encrypt module added a unit test

To execute encrypt module unit test execute:

`make test-module module=encrypt`

### Changed

#### log module configurations for "level"

By setting null, false to "level" or omitting "level" completely, you can now stop log module from logging at all.

#### staticdata module no longer throws an uncaught exception on none-indexed data

Staticdata modules no longer breaks with an exception when attempting to access values by index on none-indexed data.

#### view module variable parser improved

View module improved its variable replacement parser's error handling.

#### server module pre-defained error controller inherits original request response status

Pre-defined error handling controllers can now inherit original response status automatically.

### Depricated

None

### Removed

None

***

## Version 0.2.36

Changes for version 0.2.36

### Added

None

### Changed

#### mysql module now allows blank password

Mysql module allows empty password for DB connections.

#### gracenode core: shutdown task handler better catches exceptions

Gracenode core's shutdown task handler improved exception handling to prevent process from hanging on exceptions.

### Depricated

None

### Removed

None

***

## Version 0.2.35

Changes for version 0.2.35

### Added

None

### Changed

#### Iap module added a new method isValidated

This method evaluates the response of the purchase validation and returns true if the purchase is valid.

#### Iap module's unit test for apple purchase syntax changed

From:

`make test-iap path=/path/to/apple/receipt/sample/file service=apple`

To:

`make test-iap-apple path=/path/to/apple/receipt/sample/file`

#### Iap module added a unit test for google purchase

`make test-iap-google key=/path/to/public/key/directory path=/path/to/receipt/sample/file`

### Depricated

None

### Removed

None

***

## Version 0.2.34

Changes for version 0.2.34

### Added

#### Unit test for iap module's apple purchase validation

Unit test for iap module added. Currently apple purchase test is available. 

`make test-iap path=/path/to/apple/receipt/sample/file service=apple`

#### make command added npm install.

Executing `make` now also installs dependencies.

### Changed

#### Mongodb module's dependency version updated from 1.3.14 to 1.4.3

#### Request module added new methods

GET, POST, PUT, and DELETE methods are added. For more detail please refer to request module README

## Depricated

#### Request module depricated send method

We have now depricated send method in favor of new methods GET, POST, PUT, and DELETE.

This method will be removed in the future version.

## Removed

None

***

## Version 0.2.33

Changes for version 0.2.33

### Added

#### Unit test for mongodb module.

Mongodb module now has unit test for its APIs

For this unit test to properly work, you need to have mongoDB running at mongo://127.0.0.1:2701.

Example:

```
make test-module=mongodb
```

### Changed

#### Mongodb module findEeach function bug fix.

findEach function no longer returns an empty array at the last iteration.

### Depricated

None

### Removed

None

***

## Version 0.2.32

Changes for version 0.2.32

### Added

None

### Changed

#### Server module removed "respondOnException" behavior.

Respond on exception has been removed due to its unstable nature and impact on performance.

### Depricated

None

### Removed

#### Server module removed depricated request object methods

Depricated request object methods getData, postData, putData, and deleteData have been removed.

***

## Version 0.2.31

Changes for version 0.2.31

### Added

None

### Changed

#### Server module performance improved.

Server module now handles each request with unnecessary events.

### Depricated

None

### Removed

None

***

## Version 0.2.30

Changes for version 0.2.30

### Added

None

---

### Changed

#### Server module error handler.

Internal error handler of server module now has consistent error data type (Error object).

The response of internal errors to the client will always be a compressed string.

#### Server module unit test added test for HTTPS server.

Server module unit test now tests starting of HTTPS server.

#### gracenode.override() added.

Gracenode now has a new method called "override". This method allows the application to override the built-in module of the same name.

Example:

```
var gn = require('gracenode');

gn.addModulePath('myModules/');

// this tells gracenode to use myModules/view instead of the built-in view module of gracenode
gn.override('view');

gn.setup(function () {
	// gracenode is ready
});
```

#### Staticdata module unit test added.

Tests staticdata module.

```
make test-module module=staticdata
```

### Depricated

#### gracenode.allowOverride() is now depricated and will be removed in the future version.

---

### Removed

None

***

## Version 0.2.29

Changes for version 0.2.29

### Added

Unit test "gracenode set up" added.

Unit test "gracenode module server" added.

#### How to execute unit test "gracenode set up"

This will test gracenode set up.

```
make test
```

#### How to execute unit test "gracenode server module"

This will test gracenode built-in module.

```
make test-module module=server
```

---

### Changed


#### Server module logging

Server module outputs error log on response errors.

---

### Depricated

None

---

### Removed

None

***

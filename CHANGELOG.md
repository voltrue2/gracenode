# Change Log

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

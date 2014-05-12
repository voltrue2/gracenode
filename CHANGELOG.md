# Change Log

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

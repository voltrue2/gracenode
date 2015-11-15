# gracenode 2.0

©Nobuyori Takahashi < voltrue2@yahoo.com >

## What gracenode does

- Manages cluster process.

- Handles daemonizing of the application and auto-restarting on file changes.

- Bootstrap other modules to organize setting up of each module on starting of the application process.

- Provides a built-in logging module.

- Provides plethora of utility functions to aid development.

- Provides HTTP router for web applications.

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
        "gracenode": "2.0.0"
    }
}
```

**Install From Git Without package.json**

`npm install git+https://github.com/voltrue2/gracenode.git#master`

## How To Use gracenode

In order to use **gracenode**, you need to properly set it up in your application root file (The file that starts your application).

### Configure Logging and Cluster Management

These are optional configurations, but you will want to know what they do.

```javascript
var gn = require('gracenode');

// Here the configurations are given as an object
gn.configure({
	log: {
		file: '/path/to/my/logging/dir/'
	},
	cluster: {
		// Maximum number of workers
		max: 0
	},
	ruter: {
		port: 8888,
		host: 'localhost'
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
gracenode.router.get('/', function (req, res) {
	var data = {
		title: 'Hello World'
	};
	var renderedHTML = gracenode.render('view/index.html', data); 
	res.html(renderedHTML);
});
```

### .router

An HTTP server router to help you build HTTP rest server.

For more details please read <a href="https://github.com/voltrue2/gracenode#router-1">here</a>.

#### Register Routings

To register HTTP endpoints, call the following functions.

#### Configurations

```
gracenode.config({
	router: {
		port: <number>,
		host: <string>
	}
});
```

#### gracenode.router.get(url [string], handler [function])

Registers a routing for GET requests.

**Example**:

```javascript
var gn = require('gracenode');
gn.config({
	router: {
		port: 8888,
		host: 'localhost'
	}
});
gn.router.get('/example', function (req, res) {
	res.json({ title: 'Hello World' });
});
gn.router.get('/mypage', require('/path/to/mypage/handler'));
```

<a href="https://github.com/voltrue2/gracenode#router-1">More Details Here</a>

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

**NOTE**: If there is an error while starting the process, it will crush with an exception.

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

## Render

Render allows you to create dynamic content from templated static files.

It also supports caching rendered data for static templates to improve the run-time performance.

It is useful for web pages etc.

### gracenode.render(path [string], data [object], cacheTtl [*number])

#### path

A path to the pre-rendered file data to render. 

#### data

An object to be inserted into the rendered file data.

#### cacheTtl

An option to use cache for rendered template data.

If this parameter is not given, it does not use cache

The cache data will be ignored if given `data` is different from the cached rendered data.

**NOTE**: cacheTtl is in miliseconds. If the cache needs to last for 24 hours, cacheTtl = 8640000.

### Configurations

Render requires a path to read the template files from.

It will then read all template files and pre-render them on the application process start.

```
render: {
	path: '/path/to/my/templates'
}
```

**Example**:

```javascript
var gn = require('gracenode');
gn.config({
	render: {
		path: '/path/to/my/template/files/'
	}
});
```

### Embedding Dynamic Data

Render can insert dynamically define values to rendered template file data.

#### Embed Variables

**Syntax**

```
{{variableName}}
```

**Example**:

```html
<div>{{myCar}}</div>
```

```javascript
var rendered = gracenode.render('/myview.html', {
	myCar: 'BMW'
});
```
The above examples will result in `{{myCar}}` being replaced by `{ myCar: 'BMW' }`, so the rendered result is:

```html
<div>BMW</div>
```

#### Handle Require Statement

Render can combine multiple pre-rendered template files into one file and render it as one render data.

**Syntax**

```
{{require(/path/to/my/partial.html)}}
```

#### Handle If/Else If/Else Statements

Render handles simple if statements.

**WARNING**: You must not have nested if statements.

**WARNING**: You must not have if statement inside of for statement. 

**Syntax**

```
{{if ({a} === {b}):
	<div>{a}&nbps;is&nbsp;{b}</div>
endif}}
```

**Example**:

```html
{{if ({a} === {b}):
	<div>{a}&nbps;is&nbsp;{b}</div>
else if (a > b):
	<div>{a}&nbsp;is&nbsp;greater&nbps;than&nbsp;{b}</div>
else:
	<div>{a}&nbps;is&nbsp;NOT&nbsp;{b}</div>
endif}}
```

```javascript
var rendered = gracenode.render('myview.html', {
	a: 100,
	b: 10
});
```

**IMPORTANT**: The variables inside **if** must be `{variableName}` NOT `{{variableName}}`.

The above example will result in `<div>{a}&nbsp;is&nbsp;greater&nbps;than&nbsp;{b}</div>` to be in the rendered result:

```html
<div>100&nbsp;is&nbsp;greater&nbps;than&nbsp;10</div>
```

#### Handle For Statements (Array Only)

Render handles simple for statements.

**WARNING**: You must not have nested for statements.

**WARNING**: You must not have if statement inside for statement.

**Syntax**

```
{{for (i = i < {list.length}; i++):
	<div>{i}:{list.i}</div>
endfor}}
```

**NOTE**: `{list.i}` = `list[i]`

**Example**:

```html
{{for (i = 0; i < {list.length}; i++):
	<div>{i}:{list.i}</div>
endfor}}
```

```javascript
var rendered = gracenode.render('/myview.html', {
	list: [
		'Apple',
		'Carrot',
		'Orange'
	]
});
```

**IMPORTANT**: The variables inside **for** must be `{variableName}` NOT `{{variableName}}`.

The above example will result in:

```html
<div>0:Apple</div>
<div>1:Carrot</div>
<div>2:Orange</div>
```

#### Handle ForEach Statement (Object Only)

Render handles a simple for loop for object as `foreach`.

**Syntax**

```
{{foreach (key in {map})
	<div>{key}:{map.key}</div>
endforeach}}
```

**NOTE**:

`{map.key}` = `map[key]`

**Example**

```html
{{foreach (key in {map})
	<div>{key}:{map.key}</div>
endforeach}}
```

```javascript
var rendered = gracenode.render('/myview.html', {
	map: {
		meat: beef,
		meat: pork,
		fruit: apple,
		veggi: beans
	}
});
```

**IMPORTANT**: The variables inside **foreach** must be `{variableName}` NOT `{{variableName}}`.

The above example will result in:

```html
<div>meat:beef</div>
<div>meat:pork</div>
<div>fruit:apple</div>
<div>veggi:beans</div>
```

## Router

Router lets you build HTTP server and REST endpoints easily.

### Access

`gracenode.router`

### Configure Port and Host

`gracenode.router` needs a port number and a host name to start the HTTP server.

```
router: {
	port: <number>,
	host: <string>
}
```

**Example**:

```javascript
var gn = require('gracenode');

gn.config({
	router: {
		port: 8888,
		host: 'localhost'
	}
});

gn.start(function () {
	// HTTP server is ready
});

```

**NOTE**: Once you give `port` and `host`, **gracenode** will automatically start the HTTP server while `gracenode.start()`.

### Register endpoints

You must register endpoint routes in order to setup your REST server with `gracenode.router`.

#### GET

```javascript
gracenode.router.get('/example', function (req, res) {
	// respond as JSON
	res.json({ say: 'hello' });
});
```

##### Define URL parameters

`gracenode.router` allows you to define parameters in the request URLs.

**Example**:

The example below defines a URL parameter `name`.

```
GET /example/{name}
```

```
GET /example/Kevin
```

The above request URL will be routed to the handler of `GET /example/{name}`.

To access `{name}`:

```
exports.exampleHandler = function (req, res) {
	// Kevin
	var name = req.params.name;
};
```

#### POST, PUT, DELETE, PATCH, and HEAD

To register endpoints for request method other than `GET`, use the following:

```
gracenode.router.post(url [string], handler [function]);

gracenode.router.put(url [string], handler [function]);

gracenode.router.delete(url [string], handler [function]);

gracenode.router.patch(url [string], handler [function]);

gracenode.router.head(url [string], handler [function]);
```

#### req

The handler functions of endpoints will be passed two arguments.

The first argument is `req`. It is an expanded `request` object.

**Properties**:

##### req.url

Request URL.

##### req.headers

Request headers.

##### req.id

Unique ID for each request.

##### req.args

Object to hold user data for sharing the data among <a href="https://github.com/voltrue2/gracenode#register-request-hooks">request hooks</a> and handler.

**Example**:

```
// set session ID
req.args.sessionId = 'xxxx';

// you can use the session ID elsewhere
var sessionId = req.args.sessionId;
```

##### req.query

Object that holds GET query data.

**Example**:

```
// request URL: GET /example?id=1234
var id = req.query.id;
```

##### req.params

Object that holds URL parameters.

**Example**:

Example Request: `GET /example/animal/info/cat`.

```javascript
gracenode.router.get('/example/{category}/info/{name}', function (req, res) {
	// animal
	var category = req.params.category;
	// cat
	var name = req.params.name;
	// do somethinf
});
```

##### req.body

Object that holds request body (For POST, PUT, DELETE, and PATCH).

##### req.cookies()

Returns a cookie object.

**Example**:

How to set a cookie data

```javascript
gracenode.router.login('/login', function (req, res) {
	// do some loging operations here
	var cookies = req.cookies();
	cookies.set('sessionId', sessionId);
	// respond here
});
```

How to get a cookie data

```javascript
gracenode.router.get('/example', function (req, res) {
	var cookies = req.cookies();
	var sessionId = cookies.get('session');
});
```

#### res

Response object tat wraps the HTTP response object of node.js.

##### res.headers

Object that holds response headers.

**To Set Response Headers**:

```javascript
gracenode.router.post('/example', function (req, res) {
	// set a custom header
	res.headers.sessionId = 'xxxx';
	// respond
	res.html(htmlData);
});
```

##### res.json(data [object], status [*number])

Send response as JSON.

The default status is 200.

##### res.html(html [string], status [*number])

Send response as HTML.

The default status is 200.

##### res.text(text [string], status [*number])

Send response as plain text.

The default status is 200

###### res.download(filePath [string], status [*number])

File download response.

The default status is 200.

###### res.stream(filePath [string])

Stream file. 

Useful for HTML5 video streaming etc.

###### res.error(error [object], [*number])

Send response as error (response data is JSON object).

The default status is 400.

#### Register Request Hooks

`gracenode.router` allows you to setup request hook functions for your endpoints.

Useful for session varification etc.

##### gracenode.router.hook(url [string], hook [function])

Registered hook functions are executed on every match request.

**Example**:

```javascript
gracenode.router.hook('/', hookForAllRequest);
gracenode.router.hook('/exmaple', hookForExampleRequest);
gracenode.router.hook('/example/one', hookForExampleOneReuqest);

gracenode.router.get('/example', exampleHandler);
gracenode.router.get('/example/one', exampleOneHandler);
```

- `GET /example` will have `hookForAllRequest`, `hookForExampleRequest` as request hooks and they will be executed BEFORE `exmapleHandler`.

- `GET /example/one` will have `hookForAllRequest`, `hookForExampleRequest`, and `hookForExampleOneRequest` as request hooks and they will be executed BEFORE `exampleOneHandler`.

**Hook Function**:

```javascript
function hook(req, res, next) {
	// call next() to move on to next hook or handler
	next();
}
```

Each hook function will have `req`, `res`, and `next` as arguments.

`req` is the expanded request object. 

`res` is the response object.

`next` is the function to move on to next hook or handler.

##### gracenode.router.error(status [number], handler [function])

`gracenode.router` can optionally execute an error handler for specific error status such as 404.

This is useful when you need to display uniform 404 page on every 404 response etc.

## gracenode.lib

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

#### .cloneObj(obj [object], propNames [array])

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


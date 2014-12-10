# Change Log

This is a list of manually mantained changes and updates for each version.

## Version 1.3.11

## Added

None

## Changed

#### Improved the stability of daemon stop command execution

Daemon stop command now removes the socket file and exits the process.

Added an error catch to that flow and monitor process will NOT exit on failed socket file removal.

## Deprecated

None

## Removed

None

***

## Version 1.3.10

## Added

#### - lib module added .find()

Finds and returns matched elements and their indexes from an object/array by user defined function.

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

## Changed

#### - core module loader improved module name conflict detection on .setup()

Gracenode can detect module name conflicts even for modules that are not called by `gracenode.use()`.

When conflict is detected, gracenode stops running immediately.

Example:

```
exit gracenode with an error: module name conflict detected for [redis] in /home/nt/game/node_modules/redis and /home/nt/game/modules/redis
```

## Deprecated

None

## Removed

None

***

## Version 1.3.8

## Added

None

## Changed

#### - Daemon list refactored

#### - Daemon reload refactored

#### - Daemon restart refactored

#### - Daemon stop refactored

#### - Daemon start refactored

#### - Daemon status refactored

## Deprecated

None

## Removed

None

***

## Version 1.3.7

## Added

None

## Changed

#### - Help (--help) output reformatted

#### - Improved error out for alformed configurations

#### - Dependency gracelog's version updated

From `0.1.21` to `0.2.1`.

## Deprecated

None

## Removed

None

***

## Version 1.3.6

## Added

None

## Changed

#### - Bug fix for daemon list output when --log=/path/to/log/dir/ given

#### - Deamon reload status output improvements

#### - Improved the stability of daemon reload command to ensure there is always at least one worker process running

#### - gracenode.send() properly fails on message object parse failure

#### - Debug mode memory watch output now uses logger.table()

#### - Updated dependency gracelog version

Version updated from `0.1.20` to `0.1.21`.

## Deprecated

None

## Removed

None

***

## Version 1.3.5

## Added

None

## Changed

#### Improved daemon list command output

#### Minor improvements in Makefile

#### Updated a dependency version (gracelog)

Version updated from `0.1.18` to `0.1.20`.

#### Bug fix in ./daemon list command

The command could lis wrong pids for wrong processes.

#### Profiler module now uses log module's .table() to output the result

## Deprecated

None

## Removed

None

***

## Version 1.3.4

## Added

#### Added deprecated.json added to manage deprecated information

## Changed

#### Updated a dependency version

Updated gracelog version from `0.1.13` to `0.1.18`.

## Deprecated

None

## Removed

None

***

## Version 1.3.3

## Added

#### Debug mode now scans for deprecated gracenode functions

## Changed

#### Configuration name for debug mode changed

The configuration property name for `debug` mode has changed from `debugMode` to `gracenode-debug`.

#### Progress bar added to debug mode

## Deprecated

#### .getModuleSchema has been deprecated

Since `gracenode` no longer has built-in mysql modules, it makes sense to remove this function from it.

## Removed

None

***

## Version 1.3.2

## Added

#### Debug mode now runs memory usage monitor along with jshint on start of the application

## Changed

#### All gracenode code now lints with strict mode

#### Test timeout is now 5000ms instead of 2000ms

#### .registerShutdownTask() of gracenode now throws an exception for passing a 2nd argument other than a function

#### Logging level of debug mode changed

The log message when there is no lint error has been changed from `error` to `debug`.

## Deprecated

None

## Removed

None

***

## Version 1.3.1

## Added

#### Debug mode added

`gracenode` can optionally run your application in debug mode.

For more details please read <a href="https://github.com/voltrue2/gracenode#debug-mode">here</a>.

## Changed

#### daemon status added monitor version

## Deprecated

None

## Removed

None

***

## Version 1.3.0

## Added

#### daemon tool added reload

Reload option allows daemon tool to reload the daemonized application process with out stopping.

It is only available with applications that are build with `gracenode` framework or applications.

**NOTE:** The master process of the application will NOT be reloaded.

#### gracenode now listens to SIGHUP/kill -1 to reload wroker processes in cluster mode

## Changed

#### Bug in process message from master to workers

The sent message should have been a JSON.parsed object instead of a string.

## Deprecated

None

## Removed

None

***

## Version 1.2.4

## Added

None

## Changed

#### Minor change and commented out code removal

## Deprecated

None

## Removed

None

***

## Version 1.2.3

## Added

None

## Changed

#### .setConfigPath() now supports full path as an option

`.setConfigPath()` uses the given path string as a full path if the second argument is set `true`.

Example:

```
var grancenode = require('gracenode');
gracenode.setConfigPath('/full/path/to/my/config/directory/', true);
```

## Deprecated

None

## Removed

None

***

## Version 1.2.2

## Added

None

## Changed

#### Improved the way gracenode detects the application root path

`.getRootPath()` now returns correct root path of application even if `gracenode` is installed as an indirect dependency (dependency of dependency etc...)

#### lint error in script daemon fixed

#### Script preCommit.sh added for internal git pre-commit hook

#### Script lint.sh refactored

## Deprecated

None

## Removed

None

***

## Version 1.2.1

## Added

None

## Changed

#### log module's default log name does not have the full file path

#### Updated dependency gracelog version from 0.1.10 to 0.1.13

#### Minor bug fix in daemon log

## Deprecated

None

## Removed

None

***

## Version 1.2.0

## Added

#### Improved error logging for invalid configurations on set up

#### Outputs jshint errors when gracenode detects invalid configurations

## Changed

#### Improved error checking before calling .setup()

#### Logging level of sending/receiving messages from/to master and worker changed to verbose

#### Improved error handling for defineOption()

## Deprecated

None

## Removed

None

***

## Version 1.1.38

## Added

None

## Changed

#### Dependency gracelog version updated

#### Minor changes in client/js object-data.js

object-data.js is now data-object.js

## Deprecated

None

## Removed

None

***

## Version 1.1.37

## Added

None

## Changed

#### gracenode.defineOption() now supports get arguments As none-array

By setting `false` to the third argument as shown below, gracenode passes the arguments to defined variables in the callback function.

Example:

```
// node myapp -t one two three
gracenode.defineOption('-t', 'Expects 3 arguments.', false, function (arg1, arg2, arg3) {
	console.log(arg1, arg2, arg3);
	// one two three
});
```

## Deprecated

None

## Removed

None

***

## Version 1.1.36

## Added

None

## Changed

#### Daemon stop now waits for the daemon process to stop completely without timeout

#### Improved fatal logging for configuration failure

#### Improved exiting process of master in cluster mode when worker processes are illigally exiting

## Deprecated

None

## Removed

None

***

## Version 1.1.35

## Added

#### Added send() to send message from workers to master or from master to workers

#### New event worker.message added

In cluster mode, your application can now capture messages sent from workers to master by listening on `worker.message`.

#### New event master.message added

In cluster mode, your application can now capture messages sent from master to workers by listening on `master.message`.

## Changed

#### Minor code improvements

## Deprecated

None

## Removed

None

***

## Version 1.1.34

## Added

None

## Changed

#### Daemon status output has been cleaned up

#### Daemon feedback output optimized

#### Corrected daemon stop feedback

#### Improved daemon start/stop feedback

## Deprecated

None

## Removed

None

***

## Version 1.1.33

## Added

None

## Changed

#### Daemon status outputs error log for orphaned processes and pids

#### Improved feedback on daemon clean command error

## Deprecated

None

## Removed

None

*** 

## Version 1.1.32

## Added

None

## Changed

#### Daemon tool added auto cleaning of detached socket files

## Deprecated

None

## Removed

None

***

## Version 1.1.31

## Added

None

## Changed

#### Daemon process check improved

#### lib.walkDir performance improved

#### Test added for lib.walkDir

## Deprecated

None

## Removed

None

***

## Version 1.1.30

## Added

None

## Changed

#### Daemon restart no longer requires "wait 10 seconds"

#### Daemon start now checks the length of the application being avialable

`daemon start` command now checks and see if the application stays available for at least 60 seconds before it exits.
If the application exits in less than 60 seconds, the daemon tool will NOT respawn the application.

#### Daemon tool output text color changed

#### Log module version updated

## Deprecated

None

## Removed

None

***

## Version 1.1.29

## Added

None

## Changed

#### Dependency garcelog's version updated

#### Daemon restart improved feedback output

#### Daemon status imrproved output

## Deprecated

None

## Removed

None

***

## Version 1.1.28

## Added

None

#### Daemon start/stop now outputs accurate feedback of application process status

#### Daemon start without application path will now have index.js appended

#### Daemon stop improved the speed

## Deprecated

None

## Removed

None

***

## Version 1.1.27

## Added

#### Daemon tool added clean

There may be a situation where you end up with daemon socket files without process associated.

`node daemon clean` will find all detached socket files and clean them all.

## Changed

#### Log module now uses gracelog npm module

For more information on `gracelog` module please read <a href="https://github.com/voltrue2/gracelog#gracelog">here</a>.

Note: There are NO breaking changes.

#### Daemon tool no longer outputs fatal error for an error

#### Daemon tool now detects orphan process(es) without associated socket file

#### Daemon tool now detects orphan socket file without associdated application process(es)

## Deprecated

None

## Removed

None

***

## Version 1.1.26

## Added

None

## Changed

#### Bug fix daemon tool

Daemon tool was unable to stop the application process if the daemon was started without `--log=` option.

Affected version: `1.1.24` and `1.1.25`

## Deprecated

None

## Removed

None

***

## Version 1.1.25

## Added

#### Log module added isEnabled()

`gracenode.log.isEnabled(logLevelName)` checks the availability of specific log level such as `verbose`.

## Changed

#### Log module fix

On exiting gracenode process, log module can now let the process to proceed to exit even when it is failing to log to files.

#### Profiler .mark() now accepts null

`gracenode.profiler.mark()` now accepts `null` instead of message string.
If `null` is given, the profile time is marked the same as when a string is given, but the null message will be skipped.

#### Profiler skipps its operation completly if used log level is disabled

## Deprecated

None

## Removed

None

***

## Version 1.1.24

## Added

None

## Changed

#### Bug fix: daemon logger now properly rotates log files on restart

`restart` of daemon now triggers logger to rotate log files to proper date.

#### Bug fix: daemon logger now properly rotates log files on stop

`stop` of daemon now triggers logger to rotate log files to proper date.

## Deprecated

None

## Removed

None

*** 

## Version 1.1.23

## Added

None

## Changed

#### Log module now tolerates missing configurations

Log module can now fall back to default configurations if configurations are missing.

## Dprecated

None

## Removed

None

***

## Version 1.1.22

## Added

#### Gracenode version check on setup

Gracenode now checks application's expected version of gracenode and

compares it against currently installed gracenode's version.

If the installed gracenode's version is lower than the application's expected version of gracenode,

`gracenode.setup()` will fail with an error.

## Changed

#### Gracenode now allows an application to have more cluster processes in cluster-mode than the number of CPU available

NOTE: Please note that each child process is a new instance of V8 instance.

## Deprecated

None

## Removed

#### Deprecated script scripts/gracenode.js has now been removed

***

## Version 1.1.21

## Added

None

## Changed

#### Bug fix in defineOption()

The negative number as a value of an option was being ignored.

Example: `node app.js -option -100`

With the bug, above command's -100 was ignored.

#### Minor improvements

## Deprecated

None

## Removed

None

***

## Version 1.1.20

## Added

#### gracenode.exitOnBadOption() added

#### Daemon tool will now exit on bad options or no options

## Changed

None

## Deprecated

None

## Removed

None

***

## Version 1.1.19

## Added

#### Added preinstall script to package.json

npm install now removes pre-existing `daemon` symbolic link and recreates the link.

## Changed

#### verbose output of application configuration reformatted

#### Minor improvements in core/

## Deprecated

None

## Removed

None

***

## Version 1.1.18

## Added

#### Uncaught exception before gracenode is ready will cause the process to exit with an error

## Changed

#### None cluster mode and master process now emit "setup.complete"

#### Daemon list changed the output format

## Deprecated

None

## Removed

None

***

## Version 1.1.17

## Added

None

## Changed

#### Daemon tool refactored

#### Daemon status fixed a race condition on message reply

#### Daemon list now displays SSH user that exected each daemon process

#### Daemon status added number of application restarts

## Deprecated

None

## Removed

None

***

## Version 1.1.16

## Added

None

## Changed

#### Daemon list performance improved

## Deprecated

None

## Removed

None

***

## Version 1.1.15

## Added

None

## Changed

#### Daemon tool improved on optional application path handling

#### Daemon tool no longer starts the application process with --daemon option

#### Daemon list improved

## Deprecated

None

## Removed

None

***

## Version 1.1.14

## Added

None

## Changed

#### Bug fix in initial install of gracenode

## Depreacated

None

## Removed

None

***

## Version 1.1.13

## Added

#### Daemon tool added status

A new option for daemon tool `status` added:

```
node daemon status /your/app/
```

Note: in order to use `status` option, you need to update your gracenode and `stop` and `start` your daemon process(s).

## Change

#### Symbolic link of daemon tool is no longer a directory

## Deprecated

None

## Removed

None

***

## Version 1.1.12

## Added

None

## Changed

#### Log module now has fall back with no configurations

Log module now falls back to `console.error()`  when there is no configurations ready.

#### Improved daemon error logging

## Version 1.1.11

## Added

None

## Changed

#### core module improved module name conflict checks

## Deprecated

#### scripts/gracenode.js

`gracenode.js` in `scripts/` directory has been deprecated as of version 1.1.11 as it was an experimental script.

## Removed

None

***

## Version 1.1.10

## Added

#### Client added object-data.js

## Changed

#### Daemon tool log file name format changed

#### Daemon tool error logging improved

#### Minor improvements in daemon tool log messages

## Deprecated

None

## Removed

None

***

## Version 1.1.9

## Added

None

## Changed

#### Bug fix: --help outputs nothing

## Deperacated

None

## Removed

None

***

## Version 1.1.8

## Added

None

## Changed

#### Daemon tool now has optional logging

Daemon tool can optionally keep log data in files.

To leave log files, execute:

```
node daemon start yourApp.js --log=/path/to/your/log/files/
```

#### Minor improvements in daemon tool

## Deperacated

None

## Removed

None

***

## Version 1.1.7

## Added

## Changed

#### Daemon tool now checks dying application

If the application dies 10 times in less than 10 seconds, daemon process will exit and stop.

#### Daemon tool restart blocks restart spam

Daemon restart now does not allow you to restart multiple times within 10 seconds.

## Deperacated

## Removed

***

## Version 1.1.6

## Added

#### Config module added .getAll()

`gracenode.config.getAll()` returns the whole configuration object.

## Changed

#### Daemon tool improved message logs

#### Daemon tool improved error checks

## Deprecated

None

## Removed

None

***

## Version 1.1.5

## Added

None

## Changed

#### Daemon tool can now daemonize any node.js application

Previously the daemon tool required your application to be build with gracenode to daemonize the process, but it is no longer a requirement.

#### Daemon tool improved

Daemon tool no longer requires gracenode application to communication via a socket file to manage start/stop.

#### Daemon tool list now groups each daemonized application process with its monitor

Output the list of daemonized application processes with correct grouping.

#### Daemon tool list added stop/restart instruction in its output

## Deprecated

None

## Removed

None

***

## Version 1.1.4

## Added

None

## Changed

#### daemon tool list with colors

#### Bug fix daemon tool list

Daemon tool `node daemon list` now displays correct pids.

## Deprecated

None

## Removed

None

***

## Version 1.1.3

## Added

None

## Changed

#### Daemon tool configuration updated

#### Daemon tool now blocks daemon process from duplicating by calling start with the same application path

#### Optimized config module

The initial loading of config files have been optimized.

## Deprecated

None

## Removed

None

***

## Version 1.1.2

## Added

None

## Changed

#### Fix in daemon list option

`ps aux | grep` command changed to `ps aux | grep "node "` to avoid false positive.

#### Bug fix in core process

If worker processes fail to se tup gracenode and die, master process was unable to exit the process and shutdown.

Fix.

## Deprecated

None

## Removed

None

***

## Version 1.1.1

## Added

#### daemon has added list option

To list the currently running daemon processes:

```
node daemon list
```

#### daemon has added restart option

To restart the currently running daemon processes:

```
node daemon restart
```

## Changed

None

## Deperacated

None

## Removed

None

***

## Version 1.1.0

## Added

#### gracenode now installs an executable script daemon in your application root after install

When you install gracenode via npm, gracenode will create a node.js script called `daemon` in your application root.

You can execute this script to start your application as daemon or stop your daemon application.

To start your application as a daemon:

`node daemon start`

To stop your daemon application:

`node daemon stop`

## Changed

#### Core index loggin cleaned up

## Deprecated

None

## Removed

None

***

## Version 1.0.25

## Added

#### Added daemon tool

To start your application as a daemon:

`scripts/daemon start path/to/your/app`

To stop your daemon application:

`scripts/daemon stop path/to/your/app`

Note: This is the first version of daemon tool. We are planning on improving this feature.

## Changed

#### Removed unnecessary optimization from cloneObj()

#### Improved the error catch for missing configuration files

## Deperacated

None

## Removed

None

***

## Version 1.0.24

## Added

None

## Changed

#### Optimized core/index.js and core/argv for v8's optimized compiler

#### Improved graceful shutdown in core process in preparation for daemon tool

Master process of the application now instructs all child processes to disconnect and shutdown.

#### Optimized log module for v8 optimized compiler

#### Optimized lib module cloneObj for v8 optimaized compiler

## Deperacated

None

## Removed

#### make command no longer installs scripts/gracenode.js to ~/bin/gracenode

***

## Version 1.0.23

## Added

None

## Changed

#### Makefile update for initial make command

#### Cluster mode now has autoSpawn option in configurations

Auto-respawning of dead child processes is now optional.

To enable auto-respawning add the following to your configurations:

```
{
	"cluster": {
		"enabled": true,
		"max": 2,
		"autoSpawn": true
	}
}
```

## Deprecated

None

## Removed

None

***

## Version 1.0.22

## Added

None

## Changed

#### Core process gracefuly shutdown improved

When workers die unexceptedly, the former graceful shutdown method had a hole where respawned works could become zombie workers.

Now the issue has been fixed properly.

## Deprecated

None

## Removed

None

***

## Version 1.0.21

## Added

None

## Changed

#### Lib module's cloneObj() now supports selective property copy

Lib module's `cloneObj()` now accepts a second argument optionally as an array of property names to clone only the given properties.

#### Core process fix for none-cluster mode graceful exit

## Deprecated

None

## Removed

None

***

## Version 1.0.20

## Added

None

## Changed

#### Core process graceful shutdown improved

Core process improved the way it handles graceful shutdown in preparation for built-in daemonization feature.

## Deprecated

None

## Removed

None

***

## Version 1.0.19

## Added

None

## Changed

#### Core process improved

The way master process handles graceful shutdown of each child processes haves improved.

#### Minor improvements

#### Executable gracenode install updated

Executing `node scripts/gracenode.js --install` will now install executable command `gracenode` in `~/bin/`

## Deprecated

None

## Removed

None

***

## Version 1.0.18

## Added

#### Custom jshint configurations added to package.json

## Changed

## Executable gracenode -l now ignores none-javascript files

## Command-line argument parser improved

The parser for command-line argments now support multiple values per options:

Example:

```
node yourApp -p /xxx/yyy/zzz/ /aaa/bbb/ccc/

// your option definition
gracenode.defineOption('-p', 'Awesome option -p.', function (paths) {
	// paths is an array that contains ['/xxx/yyy/zzz', '/aaa/bbb/ccc/']
});
```

## Deprecated

None

## Removed

None

***

## Version 1.0.17

## Added

#### Executable gracenode command added

Gracenode now has an executable command `scripts/gracenode`

To lint javascript file(s):

`scripts/gracenode -l path/to/files/or/directory`

To show gracenode version:

`scripts/gracenode -V`

## Changed

#### gracenode.defineOption's option parsing improved

#### make command now installs executable command gracenode to user's home directory

## Deprecated

None

## Removed

None

***

## Version 1.0.16

## Added

None

## Changed

#### gracenode.defineOption added third argument

`defineOption()` now allows you to define the callback function for the option.

```
gracenode.defineOption('-a', 'A is the first letter of the alphabet.', function (value) {
	// this callback will be executed if option -a is given
});

gracenode.defineOption('--test', 'This is a test option', function (value) {
	// do something
});
```

#### Client js request bug fix

## Deprecated

None

## Removed

None

***

## Version 1.0.15

## Added

None

## Changed

#### Bug fix in --help option

## Deprecated

None

## Removed

None

***

## Version 1.0.14

## Added

#### gracenode.defineOption() added

gracenode.defineOption allows you to define a command line option and add a shor t description for `--help`

#### gracenode has now --help option

`node myGracenodeApp/ --help` will display defined options and descriptions set by `.defineOption()`.

## Changed

#### gracenode.argv() now supports combined options

granode.argv() can now understand options combined such as `-abc`.

```
node myGracenodeApp/ -abc
// -abc is equivalent to givning -a -b -c
```

## Deprecated

None

## Removed

None

***

## Version 1.0.13

## Added

None

## Changed

#### Minor improvements in gracenode.setup()

#### Performance improvements in core module loading

#### Performance improvements in core .getModuleSchema()

## Deprecated

None

## Removed

None

***

## Version 1.0.12

## Added

#### Log module added a new log method .trace()

`.trace()` outputs a stack trace for debugging.

New Log Levels:

`verbose -> debug -> trace -> info -> warn -> error -> fatal`

## Changed

#### Improved gracenode setup error catch

## Deprecated

None

## Removed

None

***

## Version 1.0.11

## Added

None

## Changed

#### Core now outputs stack trace on uncaught exception log

## Deprecated

None

## Removed

None

***

## Version 1.0.10

## Added

None

## Changed

#### Log module now has .warn() as an alias of .warning()

#### .argv() now returns the argument value with proper data type (integer, string, array...)

#### Config module's lint error output formatted for better readability

#### Core process cleaned up some code

## Deprecated

None

## Removed

None

***

## Version 1.0.9

## Added

#### gracenode added .argv()

Parses arguments (process.argv) and return the value.

#### Lib module added .typeCast()

Converts a string to  appropriate data type.

## Changed

None

## Deprecated

None

## Removed

None

***

## Version 1.0.8

## Added

None

## Changed

#### Log module's configurations now accepts "level" as an array or a string

Now you can set level configurations of log module as:

```
"modules": {
	"log": {
		"console": true,
		"color": true,
		"level": [
			"verbose",
			"debug",
			"info",
			"warning",
			"error",
			"fatal"
		]
	}
}
```

Above is equivalent to 

```
"modules": {
	"log": {
		"console": true,
		"color": true,
		"level": {
			"verbose": true,
			"debug": true,
			"info": true,
			"warning": true,
			"error": true,
			"fatal": true
		}
	}
}
```

Above is equivalent to 

```
"modules": {
	"log": {
		"console": true,
		"color": true,
		"level": ">= verbose"
	}
}
```

#### Version of dependencies update

## Deprecated

None

## Removed

None

***

## Version 1.0.7

## Added

None

## Changed

#### Log module has rearranged the log prefix order

#### Core process has improved the graceful exit of child processes in cluster mode

## Depriceted

None

## Removed

None

***

## Version 1.0.6

## Added

None

## Changed

#### Log module added `.setPrefix`

You can now set prefix to every logging output in your application by invoking `.setPrefix`.

```
// set prefix when log is ready
gracenode.on('setup.log', function () {
	gracenode.log.setPrefix('PREFIX');
});
```

#### Core process now respawns a new worker on an error termination

## Deprecated

## Removed

None

***

## Version 1.0.5

## Added

None

## Changed

#### Core module has improved module name conflit checks

#### Core process has improved cluster mode graceful exit of worker processes

## Deprecated

## Removed

None

***

## Version 1.0.4

## Added

None

## Changed

#### Log module log data buffer

Log module no longer uses buffer for console logging (Node.js sdtout stream) as it is considered a development tool.

#### Core module improved module name conflicts detection and warning

## Deprecated

#### Log module's optional configuration "remote"

Log module has deprecated an optional configuration "remote" to send log data via UDP.

## Removed

None

***

## Version 1.0.3

## Added

None

## Changed

#### Improved profiler module set up in core index

#### Removed redundant configuration call for log module in core index

#### Improved error catching of module driver .expose()

#### Log module's bufferSize can now be 0

## Deprecated

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

## Deprecated

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

## Deprecated

None

## Removed

#### gracenode.override() removed

The deprecated (version 0.3.0) gracenode method .override() has now been removed from this version.

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

### Deprecated

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

### Deprecated

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

### Deprecated

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

### Deprecated

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

### Deprecated

#### additional built-in modules

Additional modules to be separated from gracenode core are now deprecated.

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

### Deprecated

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

### Deprecated

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

### Deprecated

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

### Deprecated

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

### Deprecated

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

### Deprecated

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

### Deprecated

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

### Deprecated

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

### Deprecated

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

### Deprecated

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

### Deprecated

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

### Deprecated

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

### Deprecated

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

### Deprecated

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

### Deprecated

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

### Deprecated

None

### Removed

#### Deprecated function gracenode.allowOverride is now removed

gracenode.allowOverride function has been deprecated since version 0.2.30 in favor of gracenode.override and now it has been removed.

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

### Deprecated

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

### Deprecated

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

### Deprecated

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

### Deprecated

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

### Deprecated

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

## Deprecated

#### Request module deprecated send method

We have now deprecated send method in favor of new methods GET, POST, PUT, and DELETE.

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

### Deprecated

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

### Deprecated

None

### Removed

#### Server module removed deprecated request object methods

Deprecated request object methods getData, postData, putData, and deleteData have been removed.

***

## Version 0.2.31

Changes for version 0.2.31

### Added

None

### Changed

#### Server module performance improved.

Server module now handles each request with unnecessary events.

### Deprecated

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

### Deprecated

#### gracenode.allowOverride() is now deprecated and will be removed in the future version.

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

### Deprecated

None

---

### Removed

None

***

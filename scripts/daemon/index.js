#!/usr/bin/env node

'use strict';

var fs = require('fs');
var gn = require('gracenode');
var logPath;
var autoReload;

var helpText = 'Gracenode daemonization tool:\n';
helpText += 'Usage: ./daemon [start|stop|restart|reload|status|list] [application path] [options]';

gn.setConfigPath(gn._root + 'scripts/configs/', true);
gn.setConfigFiles(['daemon.json']);

gn.exitOnBadOption();

gn.setHelpText(helpText);

gn.defineOption(['-v', '--verbose'], 'Executes daemon command with verbose option on.');

gn.defineOption(
	['-l', '--log'],
	'Enables logging into files in the given path. Example: ' +
	'./daemon start app.js --log=./daemon-logs/ or -l ./daemon-logs/',
	function (path) {
		logPath = path;
	}
);

gn.defineOption(
	'-a',
	'Enables auto-reloading of the daemon process on any file change to the application. Example: ' +
	'./daemon start app.js -a dir/to/watch/ for/auto/reload/',
	function (autoReloadIn) {
		autoReload = autoReloadIn;
	}
);

gn.defineOption('start', 'Starts application as a daemon.', function (path) {
	require('./start.js')(getPath(path), logPath, autoReload);
});

gn.defineOption('stop', 'Stops daemonized application.', function (path) {
	require('./stop.js')(getPath(path));
});

gn.defineOption('list', 'Shows a list of currently running daemon processes.', function () {
	require('./list.js')();
});

gn.defineOption('status', 'Shows status for a currently running daemon application.', function (path) {
	require('./status.js')(getPath(path));
});

gn.defineOption('restart', 'Restarts daemonized application.', function (path) {
	require('./restart.js')(getPath(path));
});

gn.defineOption(
	'reload',
	'Reloads daemonized application without downtime. ' +
	'(This option requires the application to be built with gracenode)',
	function (path) {
		require('./reload.js')(getPath(path));
	}
);

gn.defineOption(
	'clean',
	'Cleans up possible detached socket files for daemon processes that are no longer present.',
	function () {
		require('./clean.js')();
	}
);

// we don't need to do anything after starting the process
// (start|stop|restart|reload|status|list|clean) will exit the process when finished	
gn.start();

function getPath(path) {
	if (!Array.isArray(path)) {
		// default to the root of the application
		return gn.getRootPath() + 'index.js';
	}
	// or use the given path
	var app = path[0];
	var exists = fs.existsSync(gn.getRootPath() + app);
	if (exists) {
		app = gn.getRootPath() + app;
	}
	return app;
}

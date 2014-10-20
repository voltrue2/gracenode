#!/usr/bin/env node

var fs = require('fs');
var gn = require('gracenode');
var logPath;
gn.setConfigPath(gn._root + 'scripts/configs/', true);
gn.setConfigFiles(['daemon.json']);

gn.exitOnBadOption();

gn.defineOption('--log', 'Enables logging into files in the given path. Example: node daemon start app.js --log=./daemon-logs/', function (path) {
	logPath = path;
});

gn.defineOption('start', 'Starts application as a daemon.', function (path) {
	require('./start.js')(getPath(path), logPath);
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

gn.defineOption('clean', 'Cleans up possible detached socket files for daemon processes that are no longer present.', function () {
	require('./clean.js')();
});

gn.setup(function () {});

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

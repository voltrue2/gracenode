#!/usr/bin/env node

var gn = require('../../');
gn.setConfigPath('node_modules/gracenode/scripts/configs/');
gn.setConfigFiles(['daemon.json']);

gn.defineOption('start', 'Starts application as a daemon.', function (path) {
	require('./start.js')(getPath(path));
});

gn.defineOption('stop', 'Stops daemonized application.', function (path) {
	require('./stop.js')(getPath(path));
});

gn.defineOption('list', 'Shows a list of currently running daemon processes.', function () {
	require('./list.js')();
});

gn.defineOption('restart', 'Restarts daemonized application.', function (path) {
	require('./restart.js')(getPath(path));
});

gn.setup(function () {});

function getPath(path) {
	if (!Array.isArray(path)) {
		// default to the root of the application
		return gn.getRootPath();
	}
	// or use the given path
	return path[0];
}

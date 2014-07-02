#!/usr/bin/env node

var gn = require('../../');
gn.setConfigPath('node_modules/gracenode/scripts/configs/');
gn.setConfigFiles(['gracenode.json']);

gn.defineOption('start', 'Starts application as a daemon.', function (path) {
	require('./start.js')(getPath(path));
});

gn.defineOption('stop', 'Stops daemonized application.', function (path) {
	require('./stop.js')(getPath(path));
});

gn.setup(function () {
	var logger = gn.log.create('daemon');
	if (gn.argv('start')) {
		logger.info('starting the application as a daemon...', gn.argv('start'));
	}
	if (gn.argv('stop')) {
		logger.info('stopping the application...', gn.argv('stop'));
	}
});

function getPath(path) {
	if (!Array.isArray(path)) {
		// default to the root of the application
		return gn.getRootPath();
	}
	// or use the given path
	return path[0];
}

#!/usr/bin/env node

var gn = require('../../');
gn.setConfigPath('node_modules/gracenode/scripts/configs/');
gn.setConfigFiles(['gracenode.json']);

gn.defineOption('start', 'Starts application as a daemon.', function (path) {
	require('./start.js')(path || gn.getRootPath());
});

gn.defineOption('stop', 'Stops daemonized application.', function (path) {
	require('./stop.js')(path || gn.getRootPath());
});

gn.defineOption('restart', 'Restarts daemonized application.', function (path) {
	require('./restart.js')(path || gn.getRootPath());
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

'use strict';

var gn = require('gracenode');
var logger = gn.log.create('daemon-status');
var lib = require('./utils/lib');
var Status = require('./utils/status').Status;

module.exports = function (appPath) {
	// listener for exceptions
	gn.on('uncaughtException', function () {
		logger.error(lib.color(appPath, lib.COLORS.RED));
		gn.exit();
	});
	var status = new Status(appPath);
	status.setup(function () {
		if (!status.isRunning) {
			logger.error(lib.color('Daemon process ' + appPath + ' is not running', lib.COLORS.RED));
			return status.end();
		}
		status.getStatus(function (data, processList) {
			status.outputStatus(data, processList);
			status.end();
		});
	});
};

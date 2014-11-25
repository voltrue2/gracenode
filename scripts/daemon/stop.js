'use strict';

var gn = require('gracenode');
var logger = gn.log.create('daemon-stop');
var lib = require('./utils/lib');
var Status = require('./utils/status').Status;

module.exports = function (path) {
	// listener for exceptions
	gn.on('uncaughtException', function () {
		logger.error(lib.color(path, lib.COLORS.RED));
		gn.exit();
	});
	// stop daemon
	var status = new Status(path);
	status.setup(function () {
		if (!status.isRunning) {
			logger.error(lib.color('daemon process ' + path + ' not running', lib.COLORS.RED));
			return status.end();
		}
		status.stop();
	});
};

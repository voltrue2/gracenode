'use strict';

var gn = require('gracenode');
var logger = gn.log.create('daemon-stop');
var lib = require('./utils/lib');
//var talk = require('./utils/talk');
var Status = require('./utils/status').Status;

module.exports = function (path) {
	// listener for exceptions
	gn.on('uncaughtException', function () {
		logger.error(lib.color(path, lib.COLORS.RED));
		gn.exit();
	});
	// stop daemon
	/*
	talk.setup(path, function (isAppRunning) {
		if (!isAppRunning) {
			logger.error(lib.color('daemon process ' + path + ' not running', lib.COLORS.RED));
			return gn.exit();
		}
		talk.stopApp();	
	});
	*/
	var status = new Status(path);
	status.setup(function () {
		if (!status.isRunning) {
			logger.error(lib.color('daemon process ' + path + ' not running', lib.COLORS.RED));
			return status.end();
		}
		status.stop();
	});
};

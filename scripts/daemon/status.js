'use strict';

var gn = require('gracenode');
var logger = gn.log.create('daemon-status');
var talk = require('./utils/talk');
var lib = require('./utils/lib');

module.exports = function (appPath) {
	// listener for exceptions
	gn.on('uncaughtException', function () {
		logger.error(lib.color(appPath, lib.COLORS.RED));
		gn.exit();
	});
	// start talking to daemon monitor process
	talk.setup(appPath, function (isAppRunning) {
		if (!isAppRunning) {
			logger.error(lib.color('daemon process ' + appPath + ' is not running', lib.COLORS.RED));
			return gn.exit();
		}
		talk.getStatus(function () {
			gn.exit();
		});
	});
};

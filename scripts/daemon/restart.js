var gn = require('gracenode');
var logger = gn.log.create('daemon-restart');
var lib = require('./utils/lib');
var talk = require('./utils/talk');

module.exports = function (path) {
	// listener for exceptions
	gn.on('uncaughtException', function () {
		logger.error(lib.color(path, lib.COLORS.RED));
		gn.exit();
	});
	// check for daemon process
	talk.setup(path, function (isAppRunning) {
		if (!isAppRunning) {
			logger.error(lib.color('daemon process ' + path + ' not running', lib.COLORS.RED));
			return gn.exit();
		}
		// restart daemon
		talk.restartApp();
	});
};

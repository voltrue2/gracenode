var gn = require('gracenode');
var logger = gn.log.create('daemon-stop');
var lib = require('./utils/lib');
var talk = require('./utils/talk');

module.exports = function (path) {
	// listener for exceptions
	gn.on('uncaughtException', function (error) {
		logger.error(lib.color(path, lib.COLORS.RED));
		gn.exit();
	});
	// stop daemon
	talk.setup(path, function (isAppRunning) {
		if (!isAppRunning) {
			logger.error(lib.color('daemon process ' + path + ' not running', lib.COLORS.RED));
			return gn.exit();
		}
		talk.stopApp();		
	});
};

var run = require('child_process').spawn;
var gn = require('gracenode');
var logger = gn.log.create('daemon-start');
var lib = require('./utils/lib');
var talk = require('./utils/talk');

module.exports = function () {
	// listener for exceptions
	gn.on('uncaughtException', gn.exit);
	// try to clean up
	talk.clean(function (error, cleaned) {
		if (error) {
			return gn.exit(error);
		}
		if (cleaned) {
			console.log(lib.color('all detached daemon socket files have been removed', lib.COLORS.LIGHT_BLUE));
		} else {
			console.log(lib.color('no detached daemon socket files to be removed', lib.COLORS.PURPLE));
		}
		gn.exit();
	});
};

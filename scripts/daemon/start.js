'use strict';

var run = require('child_process').spawn;
var gn = require('gracenode');
var logger = gn.log.create('daemon-start');
var lib = require('./utils/lib');
var Status = require('./utils/status').Status;

module.exports = function (path, logPath) {
	// listener for exceptions
	gn.on('uncaughtException', function () {
		logger.error(lib.color(path, lib.COLORS.RED));
		gn.exit();
	});
	var status = new Status(path);
	status.setup(function () {
		if (status.isRunning) {
			logger.error(lib.color('daemon process ' + path + ' is already running', lib.COLORS.RED));
			return status.end();
		}
		// set up the options
		var args = [
			gn._root + 'scripts/daemon/monitor',
			'start',
			path
		];
		if (logPath) {
			args.push('--log=' + logPath);
			console.log(lib.color('Logging in', lib.COLORS.GRAY), lib.color(logPath, lib.COLORS.BROWN));
		}
		// start daemon
		run(process.execPath, args, { detached: true, stdio: 'ignore' });
		// now check the process' health
		status.checkProcess(function (error, running) {
			if (error) {
				return status.end(error);
			}
			if (running) {
				console.log(lib.color('Daemon process started', lib.COLORS.GRAY), lib.color(path, lib.COLORS.LIGHT_BLUE));
				var dies = lib.color(' dies', lib.COLORS.BROWN);
				var ten = lib.color(' 10 ', lib.COLORS.PURPLE);
				var exit = lib.color(' exit', lib.COLORS.BROWN);
				console.log(lib.color('If the application', lib.COLORS.GRAY) + dies + ten + lib.color('times in less than', lib.COLORS.GRAY) + ten + lib.color('seconds, the daemon process will', lib.COLORS.GRAY) + exit);
			} else {
				console.error(lib.color('Daemon process failed to start', lib.COLORS.RED), lib.color(path, lib.COLORS.RED));
			}
			status.end();
		});
	});
};

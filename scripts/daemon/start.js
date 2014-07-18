var fs = require('fs');
var run = require('child_process').spawn;
var gn = require('../../');
var logger = gn.log.create('daemon-start');
var socketName = require('./socket-name');
var lib = require('./lib');

module.exports = function (path, logPath) {
	fs.exists(socketName(path), function (exists) {
		if (exists) {
			logger.error(lib.color('daemon process ' + path + ' is already running', lib.COLORS.RED));
			return gn.exit(new Error('processAlreadyExists'));
		}
		var args = [
			gn._root + 'scripts/daemon/monitor',
			'start',
			path
		];
		if (logPath) {
			args.push('--log=' + logPath);
			console.log(lib.color('Logging in', lib.COLORS.GRAY), lib.color(logPath, lib.COLORS.BROWN));
		}
		gn.on('uncaughtException', gn.exit);
		var child = run(process.execPath, args, { detached: true, stdio: 'ignore' });
		console.log(lib.color('Daemon process started', lib.COLORS.GRAY), lib.color(path, lib.COLORS.LIGHT_BLUE));
		var dies = lib.color(' dies', lib.COLORS.BROWN);
		var ten = lib.color(' 10 ', lib.COLORS.PURPLE);
		var exit = lib.color(' exit', lib.COLORS.BROWN);
		console.log(lib.color('If the application', lib.COLORS.GRAY) + dies + ten + lib.color('times in less than', lib.COLORS.GRAY) + ten + lib.color('seconds, the daemon process will', lib.COLORS.GRAY) + exit);
		gn.exit();
	});
};

var fs = require('fs');
var run = require('child_process').spawn;
var gn = require('../../');
var logger = gn.log.create('daemon-start');
var socketName = require('./socket-name');
var lib = require('./lib');

module.exports = function (path) {
	fs.exists(socketName(path), function (exists) {
		if (exists) {
			logger.error('daemon process', path, 'already running');
			return gn.exit(1);
		}
		gn.on('uncaughtException', gn.exit);
		var child = run(process.execPath, [gn._root + 'scripts/daemon/monitor', 'start', path], { detached: true, stdio: 'ignore' });
		console.log(lib.color('Daemon process started', lib.COLORS.GRAY), lib.color(path, lib.COLORS.LIGHT_BLUE));
		var dies = lib.color(' dies', lib.COLORS.BROWN);
		var ten = lib.color(' 10 ', lib.COLORS.PURPLE);
		var exit = lib.color(' exit', lib.COLORS.BROWN);
		console.log(lib.color('If the application', lib.COLORS.GRAY) + dies + ten + lib.color('times in less than', lib.COLORS.GRAY) + ten + lib.color('seconds, the daemon process will', lib.COLORS.GRAY) + exit);
		gn.exit();
	});
};

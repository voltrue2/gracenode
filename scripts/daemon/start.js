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
		console.log(lib.color('Monitor process', lib.COLORS.GRAY), lib.color('(pid:' + child.pid + ')', lib.COLORS.PURPLE));
		gn.exit();
	});
};

var fs = require('fs');
var run = require('child_process').spawn;
var gn = require('../../');
var logger = gn.log.create('daemon-start');
var socketName = require('./socket-name');

module.exports = function (path) {
	fs.exists(socketName(path), function (exists) {
		if (exists) {
			logger.error('daemon process for', path, 'already running');
			return gn.exit();
		}
		gn.on('uncaughtException', gn.exit);
		var child = run(process.execPath, [gn._root + 'scripts/daemon/monitor', 'start', path], { detached: true, stdio: 'ignore' });
		gn.exit();
	});
};

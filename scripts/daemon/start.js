var run = require('child_process').spawn;
var gn = require('../../');
var logger = gn.log.create('daemon-start');

module.exports = function (path) {
	gn.on('uncaughtException', gn.exit);
	logger.info('starting monitor process...');
	var child = run(process.execPath, [gn._root + 'scripts/daemon/monitor', 'start', path], { detached: true, stdio: 'ignore' });
	logger.info('monitor started...');
	gn.exit();
};

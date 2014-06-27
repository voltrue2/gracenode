var run = require('child_process').fork;
var gn = require('../../');
var logger = gn.log.create('daemon-start');

module.exports = function (path) {
	gn.on('uncaughtException', gn.exit);
	logger.info('starting monitor process...');
	run(gn._root + 'scripts/daemon/monitor', ['start', path]);
	logger.info('monitor started...');
	gn.exit();
};

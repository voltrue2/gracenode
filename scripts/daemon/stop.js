var net = require('net');
var gn = require('gracenode');
var logger = gn.log.create('daemon-stop');
var sockName = require('./socket-name');

module.exports = function (paths) {
	gn.on('uncaughtException', gn.exit);
	var path = paths[0] || null;
	var sock = new net.Socket();
	sock.connect(sockName(path), function () {
		logger.info('stopping application', path);
		sock.write('stop');
		gn.exit();
	});
};

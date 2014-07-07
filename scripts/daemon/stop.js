var net = require('net');
var gn = require('gracenode');
var logger = gn.log.create('daemon-stop');
var sockName = require('./socket-name');

module.exports = function (path) {
	gn.on('uncaughtException', function (error) {
		logger.error(path, sockName(path));
		gn.exit(error);
	});
	var sock = new net.Socket();
	sock.connect(sockName(path), function () {
		sock.write('stop');
		gn.exit();
	});
};

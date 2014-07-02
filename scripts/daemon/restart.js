var net = require('net');
var async = require('async');
var exec = require('child_process').exec;
var gn = require('gracenode');
var logger = gn.log.create('daemon-restart');
var sockName = require('./socket-name');

module.exports = function (path) {
	gn.on('uncaughtException', function (error) {
		logger.error(path, sockName(path));
		gn.exit(error);
	});
	send(path, 'restart');
};

function send(path, command) {
	var sock = new net.Socket();
	sock.connect(sockName(path), function () {
		logger.info(command + ' application', path);
		sock.write(command);
		gn.exit();
	});
}

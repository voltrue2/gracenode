var net = require('net');
var fs = require('fs');
var async = require('async');
var exec = require('child_process').exec;
var gn = require('gracenode');
var logger = gn.log.create('daemon-restart');
var sockName = require('./socket-name');
var lib = require('./lib');

module.exports = function (path) {
	var sockFile = sockName(path);
	fs.exists(sockFile, function (exists) {
		if (!exists) {
			logger.error('daemon process', path, 'not running');
			return gn.exit(1);
		}
		gn.on('uncaughtException', function (error) {
			logger.error(path, sockName(path));
			gn.exit(error);
		});
		var sock = new net.Socket();
		sock.connect(sockFile, function () {
			sock.write('restart');
			console.log(lib.color('Daemon process restarted', lib.COLORS.GRAY), lib.color(path, lib.COLORS.LIGHT_BLUE));
			gn.exit();
		});
	});
};

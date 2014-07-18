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
			logger.error(lib.color('daemon process ' + path + ' not running', lib.COLORS.RED));
			return gn.exit(new Error('processNotFound'));
		}
		gn.on('uncaughtException', function (error) {
			logger.error(lib.color(path + ' ' + sockName(path), lib.COLORS.RED));
			gn.exit(error);
		});
		var sock = new net.Socket();
		sock.connect(sockFile, function () {
			sock.write('restart');
			console.log(lib.color('Daemon process restarted', lib.COLORS.GRAY), lib.color(path, lib.COLORS.LIGHT_BLUE));
			console.log(lib.color('Restarting multiple times in quick succession (within 10 seconds) is', lib.COLORS.GRAY) + lib.color(' NOT ', lib.COLORS.BROWN) + lib.color('allowed', lib.COLORS.GRAY));
			gn.exit();
		});
	});
};

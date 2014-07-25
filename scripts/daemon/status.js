var fs = require('fs');
var net = require('net');
var socketName = require('./socket-name');
var gn = require('../../');
var logger = gn.log.create('daemon-status');
var lib = require('./lib');
var Message = require('./message');

module.exports = function (appPath) {
	var sockFile = socketName(appPath);
	fs.exists(sockFile, function (exists) {
		if (!exists) {
			logger.error(lib.color('daemon process ' + appPath + ' is not running', lib.COLORS.RED));
			return gn.exit(new Error('processNotFound'));
		}
		// set up messagte system
		var message = new Message(appPath);
		message.read(function (data) {
			console.log('\n');
			console.log(lib.color('	Daemon application status for:', lib.COLORS.GRAY), lib.color(data.app, lib.COLORS.LIGHT_BLUE), lib.color('(pid:' + data.msg.pid + ')', lib.COLORS.PURPLE));
			console.log(lib.color('	Application started:          ', lib.COLORS.GRAY), lib.color(new Date(data.msg.started), lib.COLORS.BROWN));
			console.log('\n');
			message.stop();
			gn.exit();
		});
		// set up exit cleaning
		process.on('exit', function () {
			message.stop();
		});
		// send command to monitor
		 gn.on('uncaughtException', function (error) {
                        logger.error(lib.color(appPath + ' ' + sockFile, lib.COLORS.RED));
                        gn.exit(error);
                });
                var sock = new net.Socket();
                sock.connect(sockFile, function () {
                        sock.write('message\tstatus\t' + appPath);
                });
	});

};

var fs = require('fs');
var net = require('net');
var Message = require('./message');
var socketName = require('./socket-name');
var lib = require('./lib');
var gn = require('../../../');
var sockFile;
var appPath;

module.exports.setup = function (path, cb) {
	sockFile = socketName(path);
	appPath = path;
	fs.exists(sockFile, function (exists) {
		if (exists) {
			// application is running
			return cb(true);
		}
		// application is not running
		cb(false);
	});
};

module.exports.getStatus = function (cb) {
	// set up messagte system
	var message = new Message(appPath);
	message.read(function (data) {
		message.stop();
		console.log('\n');
		console.log(lib.color(' Daemon application status for:', lib.COLORS.GRAY), lib.color(data.app, lib.COLORS.LIGHT_BLUE), lib.color('(pid:' + data.msg.pid + ')', lib.COLORS.PURPLE));
		console.log(lib.color(' Application started:          ', lib.COLORS.GRAY), lib.color(new Date(data.msg.started), lib.COLORS.BROWN));
		console.log(lib.color(' Application restarted:        ', lib.COLORS.GRAY), lib.color(data.msg.numOfRestarted + ' times', lib.COLORS.GRAY));
		console.log('\n');
		cb(data);
	});
	// send command to monitor
	var sock = new net.Socket();
	sock.connect(sockFile, function () {
		sock.write('message\tstatus\t' + appPath);
	});	
};

module.exports.stopApp = function () {
	// send command to monitor
	var sock = new net.Socket();
	sock.connect(sockFile, function () {
		sock.write('stop');
		console.log(lib.color('Daemon process stopped', lib.COLORS.GRAY), lib.color(appPath, lib.COLORS.LIGHT_BLUE));
		gn.exit();
	});	
};

module.exports.restartApp = function () {
	var sock = new net.Socket();
	sock.connect(sockFile, function () {
		sock.write('restart');
		console.log(lib.color('Daemon process restarted', lib.COLORS.GRAY), lib.color(appPath, lib.COLORS.LIGHT_BLUE));
		console.log(lib.color('Restarting multiple times in quick succession (within 10 seconds) is', lib.COLORS.GRAY) + lib.color(' NOT ', lib.COLORS.BROWN) + lib.color('allowed', lib.COLORS.GRAY));
		gn.exit();
	});
};

var async = require('async');
var exec = require('child_process').exec;
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
		// is there detached process running without socket file?
		findDetachedProcesses(path, function (error, detached) {
			if (error) {
				throw error;
			}
			if (detached && detached.length) {
				// there are processes w/o associated socket file
				console.log(lib.color('application process(es) without associated socket file found: please "kill" these process(es) to continue', lib.COLORS.RED));
				throw new Error('detachedProcessFound');
			}
			// application is not running
			cb(false);
		});
	});
};

module.exports.getStatus = function (cb) {
	// set up messagte system
	var message = new Message(appPath);
	var onData = function (data) {
		message.stop();
		console.log('\n');
		console.log(lib.color(' Daemon application status for:', lib.COLORS.GRAY), lib.color(data.app, lib.COLORS.LIGHT_BLUE), lib.color('(pid:' + data.msg.pid + ')', lib.COLORS.PURPLE));
		console.log(lib.color(' Application started:          ', lib.COLORS.GRAY), lib.color(new Date(data.msg.started), lib.COLORS.BROWN));
		console.log(lib.color(' Application restarted:        ', lib.COLORS.GRAY), lib.color(data.msg.numOfRestarted + ' times', lib.COLORS.GRAY));
		console.log('\n');
		cb(data);
	};
	// send command to monitor
	message.read(onData, function () {
		var sock = new net.Socket();
		sock.connect(sockFile, function () {
			sock.write('message\tstatus\t' + appPath);
		});
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

// cleans up all orphan socket files without monitor process
module.exports.clean = function (cb) {
	var socks = [];
	var toBeRemoved = [];
	var getAllSocks = function (next) {
		fs.readdir('/tmp/', function (error, list) {
			if (error) {
				return next(error);
			}
			// pick gracenode daemon socket files only
			socks = list.filter(function (item) {
				return item.indexOf('gracenode') === 0;
			});
			next();
		});
	};
	var findMonitors = function (next) {
		async.eachSeries(socks, function (sockFile, callback) {
			var path = '/tmp/' + sockFile;
			var sock = new net.Socket();
			sock.once('error', function () {
				// this socket file's monitor process is no longer there
				console.log(lib.color('socket file without application process found: ' + path, lib.COLORS.GRAY));	
				toBeRemoved.push(path);
				callback();
			});
			sock.connect(path, function () {
				// this socket file's monitor is still running
				callback();
			});
		}, next);
	};
	var removeOrphanSocketFiles = function (next) {
		async.eachSeries(toBeRemoved, function (path, callback) {
			fs.unlink(path, function (error) {
				if (error) {
					return next(error);
				}
				console.log(lib.color('socket file without application proccess has been deleted: ' + path, lib.COLORS.GREEN));
				callback();
			});
		}, next);
	};
	async.series([getAllSocks, findMonitors, removeOrphanSocketFiles], function (error) {
		if (error) {
			return cb(error);
		}
		cb(null, toBeRemoved.length > 0);
	});
};

function findDetachedProcesses(path, cb) {
	exec('ps aux | grep "' + path + '"', function (error, stdout) {
		if (error) {
			return cb(error);
		}
		var detached = [];
		var list = stdout.split('\n');			
		// look for monitor process and application process(es)
		for (var i = 0, len = list.length; i < len; i++) {
			var p = list[i];
			var execPath = p.indexOf(process.execPath);
			var monitor = p.indexOf('monitor');
			var app = p.indexOf(path);
			if (execPath !== -1 && monitor !== -1 && app !== -1) {
				console.log(lib.color('monitor process without associdated socket file found: ' + p, lib.COLORS.PURPLE));
				detached.push(p);
			} else if (execPath !== -1 && app !== -1) {
				console.log(lib.color('application process without associated socket file found: ' + p, lib.COLORS.PURPLE));
				detached.push(p);
			}
		}
		cb(null, detached);
	});
}

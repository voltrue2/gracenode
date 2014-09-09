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
var MAX_TRY = 10;

module.exports.setup = function (path, cb) {
	sockFile = socketName(path);
	appPath = path;
	fs.exists(sockFile, function (exists) {
		if (exists) {
			// is there process for this socket?
			findProcesses(path, function (error, processList) {
				if (error) {
					throw error;
				}
				if (!processList || !processList.length) {
					console.error(lib.color('application process(es) associated to the socket file not found [' + appPath + ']', lib.COLORS.RED));
					console.error(lib.color('use "node daemon clean" command to clean up the detached socket files to continue', lib.COLORS.RED));
				}
				// application is running
				return cb(true);
			});
			return;
		}
		// is there detached process running without socket file?
		findProcesses(path, function (error, detached) {
			if (error) {
				throw error;
			}
			if (detached && detached.length) {
				// there are processes w/o associated socket file
				console.error(lib.color('application process(es) without associated socket file found [' + appPath + ']: please "kill" these process(es) to continue', lib.COLORS.RED));
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
		findProcesses(appPath, function (error, list) {
			if (error) {
				return gn.exit(error);
			}
			console.log('\n');
			for (var i = 0, len = list.length; i < len; i++) {
				var p = list[i].substring(list[i].indexOf(process.execPath) + process.execPath + 1);
				var prefix;
				if (p.indexOf('monitor') === -1) {
					prefix = lib.color(' Daemon application process:', lib.COLORS.GRAY);
				} else {
					prefix = lib.color(' Daemon monitor process:    ', lib.COLORS.GREEN);
				}
				var app = lib.color(p, lib.COLORS.LIGHT_BLUE);
				console.log(prefix, app);
			}
			console.log(lib.color(' Application started:       ', lib.COLORS.GRAY), lib.color(new Date(data.msg.started), lib.COLORS.BROWN));
			console.log(lib.color(' Application restarted:     ', lib.COLORS.GRAY), lib.color(data.msg.numOfRestarted + ' times', lib.COLORS.GRAY));
			console.log('\n');
			cb(data);
		});
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
		module.exports.isNotRunning(function (error, running) {
			if (error) {
				return gn.exit(error);
			}
			if (running) {
				console.error(lib.color('Daemon process failed to stop', lib.COLORS.RED), lib.color(appPath, lib.COLORS.LIGHT_BLUE));
				return gn.exit();
			}
			console.log(lib.color('Daemon process stopped', lib.COLORS.GRAY), lib.color(appPath, lib.COLORS.LIGHT_BLUE));
			gn.exit();
		});
	});	
};

module.exports.restartApp = function () {
	var sock;
	var connect = function (done) {
		sock = new net.Socket();
		sock.connect(sockFile, done);
	};
	var getCurrentStatus = function (done) {
		console.log(lib.color('Currently running daemon status', lib.COLORS.GRAY));
		module.exports.getStatus(function () {
			done();
		});	
	};
	var restart = function (done) {
		var message = new Message(appPath);
		message.read(function (data) {
			message.stop();
			if (data.msg && data.msg.error) {
				return done(new Error(data.msg.error));
			}
			module.exports.isRunning(function (error, running) {
				if (error) {
					return done(error);
				}
				if (running) {
					return done();
				}
				done(new Error('failed to restart daemon process [' + appPath + ']:'));
			});
		}, null);
		sock.once('error', done);
		sock.write('restart');
		console.log(lib.color('Restarting daemon ' + appPath, lib.COLORS.GRAY));
	};
	var getNewStatus = function (done) {
		console.log(lib.color('Restarted daemon status', lib.COLORS.GRAY));
		setTimeout(function () {
			module.exports.getStatus(function () {
				done();
			});
		}, 300);
	};
	async.series([
		connect,
		getCurrentStatus,
		restart,
		getNewStatus
	],
	function (error) {
		if (error) {
			console.error(lib.color(error.message, lib.COLORS.RED));
		}
		console.log(lib.color('Restarted application as a daemon ' + appPath, lib.COLORS.LIGHT_BLUE));
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
					// failed to remove. move on
					return callback();
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

module.exports.isRunning = function (cb, counter, running) {
	counter = counter || 0;
	running = running || 0;
	// application needs to be found running more than half of the time
	if (running > MAX_TRY / 2) {
		return cb(null, true);
	}
	if (counter > MAX_TRY) {
		return cb(null, false);
	}
	counter += 1;
	findProcesses(appPath, function (error, processList) {
		if (error) {
			return cb(error);
		}
		// process needs to have at least one monitor and one application
		if (!processList || processList.length < 2) {
			setTimeout(function () {
				module.exports.isRunning(cb, counter, running);
			}, 100 + (counter * 20));
			return;
		}
		// we found the process running > we need to keep checking until MAX_TRY
		running += 1;
		module.exports.isRunning(cb, counter, running);
	});
};

module.exports.isNotRunning = function (cb, counter, notRunning) {
	counter = counter || 0;
	notRunning = notRunning || 0;
	// application needs to be found not running more than half of the time
	if (notRunning > MAX_TRY / 2) {
		return cb(null, false);
	}
	if (counter > MAX_TRY) {
		return cb(null, true);
	}
	counter += 1;
	findProcesses(appPath, function (error, processList) {
		if (error) {
			return cb(error);
		}
		// process needs to have at least one monitor and one application
		if (!processList || processList.length < 2) {
			setTimeout(function () {
				notRunning += 1;
				module.exports.isNotRunning(cb, counter, notRunning);
			}, 100 + (counter * 20));
			return;
		}
		// we found the process running > we need to keep checking until MAX_TRY
		module.exports.isNotRunning(cb, counter, notRunning);
	});
};

function findProcesses(path, cb) {
	exec('ps aux | grep "' + path + '"', function (error, stdout) {
		if (error) {
			return cb(error);
		}
		var processList = [];
		var list = stdout.split('\n');			
		// look for monitor process and application process(es)
		for (var i = 0, len = list.length; i < len; i++) {
			var p = list[i];
			var execPath = p.indexOf(process.execPath);
			var monitor = p.indexOf('monitor start ' + path);
			var app = p.indexOf(process.execPath + ' ' + path);
			if (execPath !== -1 && monitor !== -1) {
				processList.push(p);
			} else if (execPath !== -1 && app !== -1) {
				processList.push(p);
			}
		}
		cb(null, processList);
	});
}

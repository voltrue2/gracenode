'use strict';

var async = require('async');
var exec = require('child_process').exec;
var fs = require('fs');
var net = require('net');
var Message = require('./message');
var socketName = require('./socket-name');
var lib = require('./lib');
var gn = require('gracenode');
var sockFile;
var appPath;
var MAX_TRY = 10;

module.exports.setup = function (path, cb) {
	appPath = path;
	var processList = [];
	var isRunning = true;
	var sockName = appPath;
	var findAppProcess = function (next) {
		findProcesses(path, function (error, list) {
			if (error) {
				throw error;
			}
			processList = list;
			next();
		});
	};
	var checkProcess = function (next) {
		if (!processList || !processList.length) {
			// there is no process running
			isRunning = false;
			return next();
		}
		// find the real path used to run the application process
		if (processList[0].indexOf(appPath + '/index.js') !== -1) {
			sockName = appPath + '/index.js';
		} else if (processList[0].indexOf(appPath + 'index.js') !== -1) {
			sockName = appPath + 'index.js';
		} else if (processList[0].indexOf(appPath + '/') !== -1) {
			sockName = appPath + '/';
		} else if (processList[0].indexOf(appPath) !== -1) {
			sockName = appPath;
		} else if (processList[0].indexOf(appPath.replace('/index.js', '/')) !== -1) {
			sockName = appPath.replace('/index.js', '/');
		} else if (processList[0].indexOf(appPath.replace('/index.js', '/')) !== -1) {
			sockName = appPath.replace('/index.js', '');
		}
		next();
	};
	var findSockFile = function (next) {
		sockFile = socketName(sockName);
		fs.exists(sockFile, function (exists) {
			if (exists) {
				if (!isRunning) {
					console.error(lib.color('application process(es) associated to the socket file not found [' + appPath + ']', lib.COLORS.RED));
					console.error(lib.color('use "node daemon clean" command to clean up the detached socket files to continue', lib.COLORS.RED));
					console.log(lib.color('cleaning the detached socket files before continuing...', lib.COLORS.GRAY));
					return module.exports.clean(next);
				}
				// application is running
				return next();
			}
			if (isRunning) {
				// there are processes w/o associated socket file
				console.error(lib.color('associated socket file [' + sockFile + '] not found', lib.COLORS.RED));
				console.error(lib.color('application process(es) without associated socket file found [' + sockName + ']: please "kill" these process(es) to continue', lib.COLORS.RED));
				// get pids
				return module.exports.getPids(sockName, processList, function (error, list) {
					if (error) {
						console.error(lib.color(error.message, lib.COLORS.RED));
					}
					for (var i = 0, len = list.length; i < len; i++) {
						console.error(lib.color(list[i].process + ' (pid: ' + list[i].pid + ')', lib.COLORS.RED));
					}
					gn.exit();
				});
			}
			// application is not running
			next();
		});
	};
	var done = function (error) {
		if (error) {
			return gn.exit();
		}
		cb(isRunning);
	};
	async.series([
		findAppProcess,
		checkProcess,
		findSockFile
	], done);
};

module.exports.getPids = function (path, processList, cb) {
	exec('ps aux | pgrep node', function (error, stdout) {
		if (error) {
			return cb(error);
		}
		var res = [];
		var list = stdout.split('\n');
		while (list.length) {
			var pid = list.shift();
			if (!pid) {
				continue;
			}
			for (var i = 0, len = processList.length; i < len; i++) {
				if (processList[i].indexOf(pid) !== -1) {
					res.push({
						process: processList[i].substring(processList[i].indexOf(process.execPath)),
						pid: parseInt(pid, 10)
					});
				}
			}
		}
		cb(null, res);
	});
};

module.exports.getStatus = function (cb) {
	// set up messagte system
	var message = new Message(appPath);
	var onData = function (data) {
		if (!data) {
			// no data...
			return cb();
		}
		message.stop();
		findProcesses(appPath, function (error, list) {
			if (error) {
				return gn.exit(error);
			}
			module.exports.getPids(appPath, list, function (error, processes) {
				if (error) {
					return gn.exit(error);
				}
				console.log('\n');
				for (var i = 0, len = processes.length; i < len; i++) {
					var p = processes[i].process;
					p += '(pid: ' + processes[i].pid + ')';
					var prefix;
					var isMaster = data.msg.pid === processes[i].pid;
					if (p.indexOf('monitor') === -1) {
						if (isMaster) {
							prefix = lib.color(' Daemon application process (master):', lib.COLORS.GRAY);
						} else {
							prefix = lib.color(' Daemon application process (worker):', lib.COLORS.GRAY);
						}
					} else {
						prefix = lib.color(' Daemon monitor process             :', lib.COLORS.GREEN);
					}
					var color = isMaster ? lib.COLORS.DARK_BLUE : lib.COLORS.LIGHT_BLUE;
					var app = lib.color(p.substring(p.indexOf(process.execPath)), color);
					console.log(prefix, app);
				}
				console.log(lib.color(' Monitor gracenode version:	:', lib.COLORS.GRAY), lib.color(data.msg.monitorVersion, lib.COLORS.PURPLE));
				console.log(lib.color(' Application started at		:', lib.COLORS.GRAY), lib.color(new Date(data.msg.started), lib.COLORS.BROWN));
				console.log(lib.color(' Application reloaded at	:', lib.COLORS.GRAY), lib.color(new Date(data.msg.reloaded), lib.COLORS.BROWN));
				console.log(lib.color(' Application restarted		:', lib.COLORS.GRAY), lib.color(data.msg.numOfRestarted + ' times', lib.COLORS.GRAY));
				console.log(lib.color(' Application reloaded		:', lib.COLORS.GRAY), lib.color(data.msg.reloadedCount + ' times', lib.COLORS.GRAY));
				console.log('\n');
				cb(data, processes);
			});
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
		module.exports.isNotRunning(function (error, notRunning) {
			if (error) {
				return gn.exit(error);
			}
			if (!notRunning) {
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

module.exports.reloadApp = function () {
	var seenPids = {};
	var sock;
	var connect = function (done) {
		sock = new net.Socket();
		sock.connect(sockFile, done);
	};
	var getCurrentStatus = function (done) {
		console.log(lib.color('Currently running daemon status', lib.COLORS.GRAY));
		module.exports.getStatus(function (data, processes) {
			for (var i = 0, len = processes.length; i < len; i++) {
				seenPids[processes[i].pid] = true;
			}
			done();
		});	
	};
	var reload = function (done) {
		sock.write('reload');
		console.log(lib.color('Reloading daemon ' + appPath, lib.COLORS.GRAY));
		done();
	};
	var getNewStatus = function (done) {
		console.log(lib.color('Reloading daemon status', lib.COLORS.GRAY));
		module.exports.isRunning(function () {
			module.exports.getStatus(function () {
				done();
			});
		}, 0, 0, seenPids);
	};
	async.series([
		connect,
		getCurrentStatus,
		reload,
		getNewStatus
	],
	function (error) {
		if (error) {
			console.error(lib.color(error, lib.COLORS.RED));
		}
		console.log(lib.color('Reloaded application as a daemon ' + appPath, lib.COLORS.LIGHT_BLUE));
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
					console.error(lib.color('failed to remove socket file without application process: ' + path, lib.COLORS.RED));
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

module.exports.isNotRunning = function (cb, counter) {
	counter = counter || 0;
	var next = function () {
		setTimeout(function () {
			counter += 1;
			module.exports.isNotRunning(cb, counter);
		}, 100);
	};
	findProcesses(appPath, function (error, list) {
		if (error) {
			return cb(error);
		}
		if (list.length) {
			if (counter === 0 || 10 % counter === 0) {
				console.log(lib.color('running process count: ' + list.length, lib.COLORS.GRAY));
			}
			return next();
		}
		cb(null, true);
	});
};

module.exports.isRunning = function (cb, counter, running, seen) {
	counter = counter || 0;
	running = running || 0;
	seen = seen || {};
	// recursive call function
	var call = function () {
		setTimeout(function () {
			module.exports.isRunning(cb, counter, running, seen);
		}, 100 + (counter * 20));
	};
	// application needs to be found running more than half of the time
	if (running >= MAX_TRY / 2) {
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
		// we found some process(es) running
		if (processList && processList.length) {
			module.exports.getPids(appPath, processList, function (error, list) {
				var len = list.length;
				for (var i = 0; i < len; i++) {
					// we need at least 2 processes running: one is monitor and another is the application
					if (len > 1 && list[i].process.indexOf('monitor start ') !== -1) {
						running += 1;
					}
					// feedback output of running process(es)
					if (!seen[list[i].pid]) {
						seen[list[i].pid] = true;
						console.log(lib.color(list[i].process, lib.COLORS.GRAY), lib.color('(pid: ' + list[i].pid + ')', lib.COLORS.GRAY));
					}
				}
				call();
			});
			return;
		}
		// we don't see any process running
		running -= 1;
		call();
	});
};

module.exports.findApp = findProcesses;

function findProcesses(path, cb) {
	// remove /index.js if there is
	path = path.replace('/index.js', '');
	var regex = new RegExp('/', 'g');
	var patterns = '(' + path + '|' + (path.substring(0, path.length - 1)) + '|' + (path + 'index.js').replace(regex, '\\/') + '|' + (path + '/index.js').replace(regex, '\\/') + ')';
	var command = 'ps aux | grep -E "' + patterns + '"';
	exec(command, function (error, stdout) {
		if (error) {
			return cb(error);
		}
		var processList = [];
		var list = stdout.split('\n');
		var monitorPath = 'monitor start ' + path;
		var appPath = process.execPath + ' ' + path;
		var monitorReg = new RegExp(createRegExpPattern(monitorPath));
		var appReg = new RegExp(createRegExpPattern(appPath));
		for (var i = 0, len = list.length; i < len; i++) {
			var p = list[i] + ' ';
			// find monitor process
			if (p.match(monitorReg)) {
				processList.push(list[i]);
				continue;
			}
			// find app process
			if (p.match(appReg)) {
				processList.push(list[i]);
			}
		}
		cb(null, processList);
	});
}

function createRegExpPattern(path) {
	return '(' + path + ' |' + path + '/ |' + (path.substring(0, path.length - 1)) + ' |' + path + 'index.js |' + path + '/index.js )';
}

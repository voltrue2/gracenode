'use strict';

var async = require('async');
var exec = require('child_process').exec;
var fs = require('fs');
var net = require('net');
var Message = require('./message');
var socketName = require('./socket-name');
var lib = require('./lib');
var gn = require('gracenode');
var MAX_TRY = 10;

function createRegExpPattern(path) {
	return '(' + path + ' |' + path + '/ |' + (path.substring(0, path.length - 1)) + ' |' + path + 'index.js |' + path + '/index.js )';
}

function Status(appPath) {
	this.isRunning = true;
	this.appPath = appPath;
	this.socketName = '';
	this.sockFile = '';
	this.verboseEnabled = gn.argv('-v') || false;
	this.verbose('status status validation for ' + this.appPath);
	this.verbose('status validation is in verbose mode');
}

Status.prototype.verbose = function (msg) {
	if (!this.verboseEnabled) {
		return;
	}
	console.log(lib.color('[Application Status] ' + msg, lib.COLORS.GRAY));
};

Status.prototype.end = function (error) {
	this.verbose('end of status validation');
	if (error) {
		console.error(lib.color('*** ERROR:' + error.message, lib.COLORS.RED));
	}
	gn.exit();
};

Status.prototype.setup = function (cb) {
	var that = this;
	var processList = [];
	var findAppProcessList = function (next) {
		that.verbose('find application processes');
		that.findProcessList(function (error, list) {
			if (error) {
				throw error;
			}
			processList = list;
			if (!processList || !processList.length) {
				// there is no process running
				that.isRunning = false;
				that.verbose('no application process running');
				return next();
			}
			// find the real path used to run the application process
			if (processList[0].indexOf(that.appPath + '/index.js') !== -1) {
				that.socketName = that.appPath + '/index.js';
			} else if (processList[0].indexOf(that.appPath + 'index.js') !== -1) {
				that.socketName = that.appPath + 'index.js';
			} else if (processList[0].indexOf(that.appPath + '/') !== -1) {
				that.socketName = that.appPath + '/';
			} else if (processList[0].indexOf(that.appPath) !== -1) {
				that.socketName = that.appPath;
			} else if (processList[0].indexOf(that.appPath.replace('/index.js', '/')) !== -1) {
				that.socketName = that.appPath.replace('/index.js', '/');
			} else if (processList[0].indexOf(that.appPath.replace('/index.js', '/')) !== -1) {
				that.socketName = that.appPath.replace('/index.js', '');
			}
			that.verbose('socket name is ' + that.socketName);
			next();
		});
	};
	var findSockFile = function (next) {
		if (!that.socketName) {
			that.isRunning = false;
			that.verbose('no process running: validation of socket file skipped');
			return next();
		}
		that.sockFile = socketName(that.socketName);
		that.verbose('socket file path is ' + that.sockFile);
		fs.exists(that.sockFile, function (exists) {
			if (exists) {
				if (!that.isRunning) {
					console.error(lib.color('application process(es) associated to the socket file not found [' + that.appPath + ']', lib.COLORS.RED));
					console.error(lib.color('use "node daemon clean" command to clean up the detached socket files to continue', lib.COLORS.RED));
					console.log(lib.color('cleaning the detached socket files before continuing...', lib.COLORS.GRAY));
					return that.clean(next);
				}
				// application is running
				that.isRunning = true;
				that.verbose('application is running');
				return next();
			}
			if (that.isRunning) {
				// there are processes w/o associated socket file
				console.error(lib.color('associated socket file [' + that.sockFile + '] not found', lib.COLORS.RED));
				console.error(lib.color('application process(es) without associated socket file found [' + that.socketName + ']: please "kill" these process(es) to continue', lib.COLORS.RED));
				// get pids
				var pids = [];
				return that.getPids(processList, function (error, list) {
					if (error) {
						console.error(lib.color(error.message, lib.COLORS.RED));
					}
					for (var i = 0, len = list.length; i < len; i++) {
						console.error(lib.color(list[i].process + ' (pid: ' + list[i].pid + ')', lib.COLORS.RED));
						pids.push(list[i].pid);
					}
					console.error(lib.color('Kill command: kill -9 ' + pids.join(' '), lib.COLORS.RED));
					that.end();
				});
			}
			// application is not running
			that.isRunning = false;
			that.verbose('application is not running');
			next();
		});
	};
	var done = function (error) {
		if (error) {
			return that.end();	
		}
		cb();
	};
	var tasks = [
		findAppProcessList,
		findSockFile		
	];
	async.series(tasks, done);
};

Status.prototype.getStatus = function (cb) {
	var that = this;
	var message = new Message(this.appPath);
	var onData = function (data) {
		if (!data) {
			// no data...
			that.verbose('no application status data for ' + that.sockFile);
			return cb();
		}
		message.stop();
		that.findProcessList(function (error, list) {
			if (error) {
				return that.end(error);
			}
			that.getPids(list, function (error, processes) {
				if (error) {
					return that.end(error);
				}
				that.verbose('application status data received');
				cb(data, processes);
			});
		});
	};
	// send command to monitor
	this.verbose('get application status of ' + this.appPath + ' from ' + this.sockFile);
	message.read(onData, function () {
		var sock = new net.Socket();
		sock.connect(that.sockFile, function () {
			that.verbose('status command sent to monitor');
			sock.write('message\tstatus\t' + that.appPath);
		});
	});
};

Status.prototype.outputStatus = function (data, processes) {
	if (!data || !processes || !processes.length) {
		this.verbose('no application status data');
		return;
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
};

Status.prototype.stop = function () {
	// send command to monitor
	var that = this;
	var sock = new net.Socket();
	this.verbose('stopping application processes');
	sock.connect(this.sockFile, function () {
		sock.write('stop');
		that.verbose('is application running?');
		that.notRunning(function (error, notRunning) {
			if (error) {
				return that.end(error);
			}
			if (!notRunning) {
				console.error(lib.color('Daemon process failed to stop', lib.COLORS.RED), lib.color(that.appPath, lib.COLORS.LIGHT_BLUE));
				return that.end();
			}
			console.log(lib.color('Daemon process stopped', lib.COLORS.GRAY), lib.color(that.appPath, lib.COLORS.LIGHT_BLUE));
			that.end();
		});
	});	
};

Status.prototype.restart = function () {
	var that = this;
	var sock;
	var connect = function (done) {
		sock = new net.Socket();
		sock.connect(that.sockFile, done);
	};
	var getCurrentStatus = function (done) {
		console.log('');
		console.log(lib.color('Currently running daemon status', lib.COLORS.LIGHT_BLUE));
		that.getStatus(function (data, processes) {
			that.outputStatus(data, processes);
			done();
		});	
	};
	var restart = function (done) {
		var message = new Message(that.appPath);
		message.read(function (data) {
			message.stop();
			if (data.msg && data.msg.error) {
				return done(new Error(data.msg.error));
			}
			that.verbose('restart command response received');
			that.running(function (error, running) {
				if (error) {
					return done(error);
				}
				if (running) {
					return done();
				}
				done(new Error('failed to restart daemon process [' + that.appPath + ']:'));
			});
		}, null);
		that.verbose('sending restart command');
		sock.once('error', done);
		sock.write('restart');
		console.log(lib.color('Restarting daemon ' + that.appPath, lib.COLORS.GRAY));
	};
	var getNewStatus = function (done) {
		console.log(lib.color('Restarted daemon status', lib.COLORS.GRAY));
		setTimeout(function () {
			that.getStatus(function (data, processes) {
				that.outputStatus(data, processes);
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
			return that.end(error);
		}
		console.log(lib.color('Restarted application as a daemon ' + that.appPath, lib.COLORS.LIGHT_BLUE));
		console.log('');
		that.end();
	});
};

Status.prototype.reload = function () {
	var that = this;
	var seenPids = {};
	var sock;
	var connect = function (done) {
		sock = new net.Socket();
		sock.connect(that.sockFile, done);
	};
	var getCurrentStatus = function (done) {
		console.log(lib.color('Currently running daemon status', lib.COLORS.GRAY));
		that.getStatus(function (data, processes) {
			for (var i = 0, len = processes.length; i < len; i++) {
				seenPids[processes[i].pid] = true;
			}
			that.outputStatus(data, processes);
			done();
		});	
	};
	var reload = function (done) {
		sock.write('reload');
		console.log(lib.color('Reloading daemon ' + that.appPath, lib.COLORS.GRAY));
		done();
	};
	var getNewStatus = function (done) {
		console.log(lib.color('Reloading daemon status', lib.COLORS.GRAY));
		that.running(function () {
			that.getStatus(function (data, processes) {
				that.outputStatus(data, processes);
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
			return that.end();
		}
		console.log(lib.color('Reloaded application as a daemon ' + that.appPath, lib.COLORS.LIGHT_BLUE));
		that.end();
	});
};

Status.prototype.findProcessList = function (cb) {
	// remove /index.js if there is
	var path = this.appPath.replace('/index.js', '');
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
};

Status.prototype.getPids = function (processList, cb) {
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

Status.prototype.running = function (cb, counter, running, seen) {
	counter = counter || 0;
	running = running || 0;
	seen = seen || {};
	var that = this;
	this.verbose('is application running? (counter:' + counter + ')');
	// recursive call function
	var call = function () {
		setTimeout(function () {
			that.running(cb, counter, running, seen);
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
	this.findProcessList(function (error, processList) {
		if (error) {
			return cb(error);
		}
		// we found some process(es) running
		if (processList && processList.length) {
			that.getPids(processList, function (error, list) {
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

Status.prototype.notRunning = function (cb, counter) {
	counter = counter || 0;
	var that = this;
	var next = function () {
		setTimeout(function () {
			counter += 1;
			that.notRunning(cb, counter);
		}, 100);
	};
	this.findProcessList(function (error, list) {
		if (error) {
			return cb(error);
		}
		that.verbose('number of running process remaining: ' + list.length);
		if (list.length) {
			if (counter === 0 || 10 % counter === 0) {
				console.log(lib.color('running process count: ' + list.length, lib.COLORS.GRAY));
			}
			return next();
		}
		that.verbose('no more process running');
		cb(null, true);
	});
};

// cleans up all orphan socket files without monitor process
Status.prototype.clean = function (cb) {
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

module.exports.Status = Status;

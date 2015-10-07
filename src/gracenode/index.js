'use strict';

var fs = require('fs');
var async = require('async');
var log = require('gracelog');
var aeterno = require('aeterno');
var cluster = require('cluster-mode');
var rootPath = getRootPath(require('./parent').getTopmostParent());
var mod = require('./mod');

var logger;
var clusterConfig;
var modConfigs = {};
var ready = false;

var ER = {
	NOT_WRITABLE: '<NOT_WRITABLE>',
	INVALID_LOG_PATH: '<INVALID_LOG_PATH>',
};
var MODE_00200 = 128;
var MODE_00020 = 16;
var MODE_00002 = 2;

// a map of bootstrapped modules
exports.mod = {};

exports.log = log;

exports.getRootPath = function () {
	return rootPath;
};

exports.config = function (obj) {
	if (obj.log) {
		log.config(obj.log);
	}
	if (obj.cluster) {
		// this seems redundant, but it is necesarry to do this AFTER log.config()
		clusterConfig = {
			max: 0,
			logger: log.create('cluster')
		}; 
		clusterConfig = setOption(clusterConfig, obj.cluster);
	}
	modConfigs = obj;
};

exports.onExit = function (taskFunc, runOnMaster) {
	cluster.addShutdownTask(taskFunc, (runOnMaster) ? true : false);
};

// backward compatibility alias
exports.addShutdownTask = exports.onExit;

// add module name and path to be bootstrapped by .start()
exports.use = function (name, path, options) {
	mod.use(name, rootPath + path, options);
};

// call this when everything is ready
exports.start = function (cb) {
	aeterno.run(function () {
		var tasks = [
			setup,
			startCluster,
			setupLog,
			startMod,
			setupLogCleaner
		];
		var done = function (error) {
			if (error) {
				return exports.stop(error);
			}
			ready = true;
			cb();
		};
		async.series(tasks, done);
	});
};

exports.stop = function (error) {
	cluster.stop(error);
};

function setup(cb) {
	process.on('uncaughtException', function (error) {
		if (!ready) {
			cluster.stop(error);
		} else {
			logger.fatal(error);
		}
	});
	cb();
}

function startCluster(cb) {
	cluster.start(clusterConfig);
	if (cluster.isCluster()) {
		log.setPrefix((cluster.isMaster() ? 'MASTER' : 'WORKER') + ': ' + process.pid);
	}
	cb();
}

function setupLog(cb) {
	/*
	if (modConfigs.log && modConfigs.log.file) {
		// validate log path
		fs.stat(modConfigs.log.file, function (error, stat) {
			if (error) {
				return cb(new Error(ER.INVALID_LOG_PATH + ' ' + error.message));	
			}
			// check if writable
			var isOwner = process.uid === stat.uid;
			var inGroup = process.gid === stat.gid;
			var mode = stat.mode;
			var canWrite = isOwner && (mode & MODE_00200) || // is the owner and in group
				inGroup && (mode & MODE_00020) || // in group
				(mode & MODE_00002); // anyone can write
			if (!canWrite) {

				console.log(isOwner, inGroup, mode, process.uid, stat.uid, process.gid, stat.gid);
				
				return cb(new Error(ER.NOT_WRITABLE + ' ' + modConfigs.log.file));
			}
			// good to go
			logger = log.create('gracenode');
			cb();
		});
		return;
	}
	logger = log.create('gracenode');
	cb();
	*/
	canWrite(modConfigs.log || null, function (error) {
		if (error) {
			return cb(
				new Error(
					ER.NOT_WRITABLE + ' ' +
					modConfigs.log.file + ' ' +
					error.message
				)
			);
		}
		logger = log.create('gracenode');
		cb();
	});
}

function canWrite(conf, cb) {
	if (!conf.file) {
		cb();
		return;
	}
	fs.open(conf.file, 'w', function (error, fd) {
		if (error) {
			var err = null;
			switch (error.code) {
				case 'EISDIR':
					// if we can write a file here, it is good to go
					try {
						fs.writeFileSync(conf.file + '/.__');
						fs.unlinkSync(conf.file + '/.__');
					} catch (e) {
						err = e;
					}
					break;
				default:
					err = error; 
					break;
			}
			return cb(err);
		}
		fs.close(fd, function (error) {
			if (error) {
				return cb(error);
			}
			cb();
		});
	});
}

function setupLogCleaner(cb) {
	cluster.onExit(function (next) {
		logger.verbose('Cleaning up logging before exit');
		log.forceFlush(function () {
			log.clean(next);
		});
	});
	cb();
}

function startMod(cb) {
	if (!cluster.isMaster()) {
		return mod.start(modConfigs, exports.onExit, function (error, modules) {
			if (error) {
				return cb(error);
			}
			exports.mod = modules;
			cb();
		});
	}
	cb();
}

function getRootPath(file) {
	return file.substring(0, file.lastIndexOf('/') + 1);
}

function setOption(origin, opt) {
	for (var key in opt) {
		if (!origin.hasOwnProperty()) {
			origin[key] = opt[key];
		}
	}
	return origin;
}

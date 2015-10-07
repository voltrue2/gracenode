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
	if (modConfigs.log && modConfigs.log.file) {
		fs.exists(modConfigs.log.file, function (exists) {
			if (!exists) {
				return cb(new Error('<INVALID_LOG_PATH> ' + modConfigs.log.file));	
			}
			logger = log.create('gracenode');
			cb();
		});
		return;
	}
	logger = log.create('gracenode');
	cb();
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

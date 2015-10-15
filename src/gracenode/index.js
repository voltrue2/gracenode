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

// a map of bootstrapped modules
exports.mod = {};

// backward compatibility for gracenode 1.x
exports.lib = require(__dirname + '/../../lib');

exports.log = log;

exports.getRootPath = function () {
	return rootPath;
};

exports.config = function (obj) {
	for (var key in obj) {
		if (!modConfigs.hasOwnProperty(key)) {
			// new config property
			modConfigs[key] = obj[key];
		} else {
			setConfigProp(key, modConfigs, obj);
		}
	}
};

exports.onExit = function (taskFunc, runOnMaster) {
	cluster.addShutdownTask(taskFunc, (runOnMaster) ? true : false);
};

// backward compatibility alias
exports.registerShutdownTask = exports.onExit;

// add module name and path to be bootstrapped by .start()
exports.use = function (name, path, options) {
	mod.use(name, rootPath + path, options);
};

exports.isMaster = function () {
	return cluster.isMaster();
};

exports.isCluster = function () {
	return cluster.isCluster();
};

// call this when everything is ready
exports.start = function (cb) {
	applyConfig();
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
			cb();
			ready = true;
		};
		async.series(tasks, done);
	});
};

exports.stop = function (error) {
	logger.info('.stop() has been invokded', (error ? error : ''));
	cluster.stop(error);
};

function setConfigProp(key, conf, confSrc) {
	if (typeof confSrc[key] === 'object') {
		for (var key2 in confSrc[key]) {
			if (conf[key].hasOwnProperty(key2)) {
				conf[key][key2] = confSrc[key][key2];
				continue;	
			}
			setConfigProp(key2, conf[key], confSrc[key]);
		}
	} else {
		conf[key] = confSrc[key];
	}
}

function applyConfig() {
	if (modConfigs.log) {
		log.config(modConfigs.log);
	}
	if (modConfigs.cluster) {
		// this seems redundant, but it is necesarry to do this AFTER log.config()
		clusterConfig = {
			max: 0,
			logger: log.create('cluster')
		}; 
		clusterConfig = setOption(clusterConfig, modConfigs.cluster);
	}
}

function setup(cb) {
	process.chdir(rootPath);
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
	canWrite(modConfigs.log || {}, function (error) {
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
		mod.start(modConfigs, exports.onExit, function (error, modules) {
			if (error) {
				return cb(error);
			}
			exports.mod = modules;
			cb();
		});
		return;
	}
	logger.verbose('Master process does not bootstrap modules');
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

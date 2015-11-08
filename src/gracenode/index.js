'use strict';

var fs = require('fs');
var async = require('async');
var log = require('gracelog');
var aeterno = require('aeterno');
var cluster = require('cluster-mode');
var rootPath = getRootPath(require('./parent').getTopmostParent());
var config = require('./config');
var mod = require('./mod');

var logger;
var clusterConfig;
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

exports.router = require('../router');

exports.getRootPath = function () {
	return rootPath;
};

exports.config = function (obj) {
	config.load(obj);
};

exports.getConfig = function (name) {
	return config.get(name);
};

exports.onExit = function (taskFunc, runOnMaster) {
	cluster.addShutdownTask(taskFunc, (runOnMaster) ? true : false);
};

// deprecated backward compatibility alias
exports.registerShutdownTask = exports.onExit;

// add module name and path to be bootstrapped by .start()
exports.use = function (name, path, options) { 
	if (typeof path === 'string') {
		path = rootPath + path;
	}
	mod.use(name, path, options);
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
			setupLogCleaner,
			startRouter
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
	if (error) {
		logger.error('.stop() has been invoked', error);
	} else {
		logger.info('.stop() has been invoked');
	}
	cluster.stop(error);
};

function applyConfig() {
	var logConf = config.get('log');
	var clusterConf = config.get('cluster');
	var routerPort = config.get('router.port');
	var routerHost = config.get('router.host');
	var isLogging = false;
	if (logConf) {
		isLogging = true;
		log.config(logConf);
	}
	// this seems redundant, but it is necesarry to do this AFTER log.config()
	clusterConfig = {
		max: 0,
		logger: isLogging ? log.create('cluster') : null
	}; 
	if (clusterConf) {
		clusterConfig = setOption(clusterConfig, clusterConf);
	}
	if (routerPort && routerHost) {
		exports.router.config({ port: routerPort, host: routerHost });
	}
}

function setup(cb) {
	process.chdir(rootPath);
	process.on('uncaughtException', function (error) {
		if (!ready) {
			exports.stop(error);
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
	canWrite(config.get('log') || {}, function (error) {
		if (error) {
			return cb(
				new Error(
					ER.NOT_WRITABLE + ' ' +
					config.get('log.file') + ' ' +
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
	mod.start(config.get(), exports.onExit, function (error, modules) {
		if (error) {
			return cb(error);
		}
		exports.mod = modules;
		cb();
	});
}

function startRouter(cb) {
	if (!cluster.isMaster() && config.get('router.port') && config.get('router.host')) {
		exports.router.setup(cb);
		return;
	}
	logger.verbose('Master process does not start HTTP server router');
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

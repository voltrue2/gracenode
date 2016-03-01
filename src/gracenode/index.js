'use strict';

var fs = require('fs');
var async = require('async');
var log = require('gracelog');
var aeterno = require('aeterno');
var cluster = require('cluster-mode');
var rootPath = getRootPath(require('./parent').getTopmostParent());
var config = require('./config');
var mod = require('./mod');
var render = require('../render');
var lint = require('../lint');
var pkg = require('../../package.json');
var rpc = require('../rpc');

// this will be overridden by logger in setupLog()
var ignoreLint = false;
var logger = console;
var renderConf;
var clusterConfig;
var onExceptions = [];
var ready = false;

var ER = {
	NOT_WRITABLE: '<NOT_WRITABLE>',
	INVALID_LOG_PATH: '<INVALID_LOG_PATH>',
	LOG_DIR_NOT_FOUND: '<LOG_DIR_NOT_FOUND>'
};

// internal use only (src/lint)
exports._isLogging = false;

// a map of bootstrapped modules
exports.mod = {};

// backward compatibility for gracenode 1.x
exports.lib = require(__dirname + '/../../lib');

exports.log = log;

exports.render = render.render;

// deprecated
exports.router = require('../http');

exports.http = exports.router;

// not officially released nor documented
exports.rpc = rpc;

exports.getRootPath = function () {
	return rootPath;
};

exports.require = function (path) {
	return require(exports.getRootPath() + path);
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

exports.onException = function (func) {
	if (typeof func !== 'function') {
		throw new Error('InvalidOnExceptionCallback:' + func);
	}
	onExceptions.push(func);
};

// deprecated backward compatibility alias
exports.registerShutdownTask = function (name, func) {
	var e = new Error('WARNING');
	logger.warn(
		'.registerShutdownTask() has been deprecated and should not be used.',
		'Use .onExit(taskFunction, *runOnMaster) instead',
		e.stack
	);	
	exports.onExit(func);
};

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
	var start = Date.now();
	applyConfig();
	aeterno.run(function () {
		var tasks = [
			setup,
			startCluster,
			setupLog,
			execLint,
			startMod,
			setupLogCleaner,
			setupRender,
			startHTTP,
			startRPC
		];
		var done = function (error) {
			if (error) {
				return exports.stop(error);
			}
			var time = Date.now() - start;
			logger.info(
				'gracenode <v' + pkg.version + '> is ready:',
				'[time:' + time + 'ms]'
			);
			if (typeof cb === 'function') {
				cb();
			}
			ready = true;
		};
		async.series(tasks, done);
	});
};

exports.stop = function (error) {
	if (error) {
		logger.error('.stop() has been invoked:', error);
	} else {
		logger.info('.stop() has been invoked');
	}
	cluster.stop(error);
};

function applyConfig() {
	var logConf = config.get('log');
	var clusterConf = config.get('cluster');
	var httpPort = config.get('http.port') || config.get('router.port');
	var httpHost = config.get('http.host') || config.get('router.host');
	var isLogging = false;
	if (config.get('lint.enable') === false) {
		ignoreLint = true;
	}
	renderConf = config.get('render');
	if (logConf) {
		isLogging = true;
		// defaults
		if (!logConf.hasOwnProperty('bufferSize')) {
			logConf.bufferSize = 0;
		}
		if (!logConf.hasOwnProperty('level')) {
			if (!logConf.console && !logConf.file && !logConf.remote) {
				logConf.level = '> error';
			} else {
				logConf.level = '>= verbose';
			}
		}
		if (!logConf.hasOwnProperty('color')) {
			logConf.color = false;
		}
		exports._isLogging = logConf.console || logConf.file || logConf.remote ? true : false;
		log.config(logConf);
	}
	// this seems redundant, but it is necesarry to do this AFTER log.config()
	clusterConfig = {
		max: 0,
		sync: false,
		logger: isLogging ? log.create('cluster') : null
	};
	if (clusterConf) {
		clusterConfig = setOption(clusterConfig, clusterConf);
	}
	if (httpPort && httpHost) {
		exports.http.config({ port: httpPort, host: httpHost });
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
		execOnExceptions(error);
	});
	cb();
}

function execLint(cb) {
	if (ignoreLint) {
		logger.info('Ignoring lint');
		return cb();
	}
	logger.info('Lint application code');
	lint(exports.getRootPath(), config.get('lint.ignore'), function (error) {
		if (error && config.get('lint.strict')) {
			return cb(error);
		}
		if (error) {
			logger.warn(
				'Lint is in non-strict mode.',
				'To enable strict mode, add the following to your configurations:',
				'{ lint: { strict: true } }'
			);
		}
		logger.info('Lint completed');
		cb();
	});
}

function execOnExceptions(error) {
	for (var i = 0, len = onExceptions.length; i < len; i++) {
		onExceptions[i](error);
	}
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
	fs.exists(conf.file, function (exists) {
		if (!exists) {
			return cb(new Error(ER.LOG_DIR_NOT_FOUND + ' ' + conf.file));
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
	});
}

function setupLogCleaner(cb) {
	logger.info('Setting up logging cleaner on exit');
	cluster.onExit(function (next) {
		logger.verbose('Cleaning up logging before exit');
		log.forceFlush(function () {
			log.clean(next);
		});
	});
	cb();
}

function startMod(cb) {
	mod.start(exports, config.get(), exports.onExit, function (error) {
		if (error) {
			return cb(error);
		}
		cb();
	});
}

function setupRender(cb) {
	if (renderConf) {
		logger.info('Pre-render template files in', renderConf);
		var start = Date.now();
		render.config(renderConf.path, renderConf.cacheSize);
		render.setup(function (error) {
			if (error) {
				return cb(error);
			}
			logger.info('Pre-render template files complete [' + (Date.now() - start) + 'ms]');
			cb();
		});
		return;
	}
	cb();
}

function startHTTP(cb) {
	var host = config.get('http.host') || config.get('router.host');
	var port = config.get('http.port') || config.get('router.port');
	if (!cluster.isMaster() && host && port) {
		exports.http.setup(cb);
		return;
	}
	if (cluster.isMaster() && host && port) {
		logger.verbose('Master process does not start HTTP server');
	}
	cb();
}

function startRPC(cb) {
	if (!cluster.isMaster() && config.get('rpc')) {
		rpc.setup(cb);
		return;
	}
	if (cluster.isMaster() &&  config.get('rpc')) {
		logger.verbose('Master process does not start RPC server');
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

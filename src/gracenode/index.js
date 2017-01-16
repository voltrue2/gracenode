'use strict';

const ER_NOT_WRITABLE = '<NOT_WRITABLE>';
const ER_LOG_DIR_NOT_FOUND = '<LOG_DIR_NOT_FOUND>';

const fs = require('fs');
const log = require('gracelog');
const aeterno = require('aeterno');
const cluster = require('cluster-mode');
const rootPath = getRootPath(require('./parent').getTopmostParent());
const config = requireInternal('./config');
const mod = requireInternal('./mod');
const render = requireInternal('../render');
const lint = requireInternal('../lint');
const session = requireInternal('../session');
const async = requireInternal('../../lib/async');
const pkg = requireInternal('../../package.json');
const transport = requireInternal('../../lib/transport');

// this will be overridden by logger in setupLog()
var ignoreLint = false;
var logger = console;
var renderConf;
var clusterConfig;
var onExceptions = [];
var ready = false;
var isSupportedVersion = true;

// internal use only (src/lint)
exports._isLogging = false;

// a map of bootstrapped modules
exports.mod = {};

// backward compatibility for gracenode 1.x
exports.lib = requireInternal('/../../lib');

exports.log = log;

exports.render = render.render;

exports.http = require('../http');

// deprecated
exports.router = exports.http;

exports.session = session;

exports.rpc = requireInternal('../rpc');

exports.udp = requireInternal('../udp');

exports.cluster = cluster;

exports.getRootPath = function __gnGetRootPath() {
	return rootPath;
};

exports.require = function __gnRequire(path) {
	return require(exports.getRootPath() + path);
};

exports.config = function __gnConfig(obj) {
	config.load(obj);
};

exports.getConfig = function __gnGetConfig(name) {
	return config.get(name);
};

exports.onExit = function __gnOnExit(taskFunc, runOnMaster) {
	cluster.addShutdownTask(taskFunc, (runOnMaster) ? true : false);
};

exports.onException = function __gnOnException(func) {
	if (typeof func !== 'function') {
		throw new Error('InvalidOnExceptionCallback:' + func);
	}
	onExceptions.push(func);
};

// deprecated backward compatibility alias
exports.registerShutdownTask = function __gnRegisterShutdownTask(name, func) {
	const e = new Error('WARNING');
	logger.warn(
		'.registerShutdownTask() has been deprecated and should not be used.',
		'Use .onExit(taskFunction, *runOnMaster) instead',
		e.stack
	);	
	exports.onExit(func);
};

// add module name and path to be bootstrapped by .start()
exports.use = function __gnUse(name, path, options) { 
	if (typeof path === 'string') {
		path = rootPath + path;
	}
	mod.use(name, path, options);
};

exports.isMaster = function __gnIsMaster() {
	return cluster.isMaster();
};

exports.isCluster = function __gnIsCluster() {
	return cluster.isCluster();
};

// call this when everything is ready
exports.start = function __gnStart(cb) {
	const start = Date.now();
	applyConfig();
	aeterno.run(function aeternoRun() {
		const tasks = [
			setup,
			startCluster,
			setupLog,
			execLint,
			setupLogCleaner,
			setupRender,
			setupSession,
			startHTTP,
			startUDP,
			startRPC,
			startMod
		];
		const done = function __startDone(error) {
			if (error) {
				return exports.stop(error);
			}

			// setup
			transport.setup();

			const time = Date.now() - start;
			logger.info(
				'node.js <' + process.version + '>',
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

exports.stop = function __gnStop(error) {
	const trace = new Error('Stop Call Trace');
	if (error) {
		logger.error(trace.stack);
		logger.error('.stop() has been invoked:', error);
	} else {
		logger.info(trace.stack);
		logger.info('.stop() has been invoked');
	}
	cluster.stop(error);
};

exports.isSupportedVersion = function __gnIsSupportedVersion() {
	return isSupportedVersion;
};

function applyConfig() {
	const logConf = config.get('log');
	const clusterConf = config.get('cluster');
	const httpPort = config.get('http.port') || config.get('router.port');
	const httpHost = config.get('http.host') || config.get('router.host');
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
	process.on('uncaughtException', function __onUncaughtException(error) {
		if (!ready) {
			exports.stop(error);
		} else {
			logger.fatal(error);
		}
		execOnExceptions(error);
	});
	const gnReqVersion = parseFloat(pkg.engine.engine.replace('node >= ', ''));
	const currentV = parseFloat(process.version.replace('v', ''));
	if (gnReqVersion > currentV) {
		logger.warn(
			'gracenode requires', pkg.engine.engine,
			'but current version of node is', process.version
		);
		isSupportedVersion = false;
	}
	cb();
}

function execLint(cb) {
	if (ignoreLint) {
		logger.info('Ignoring lint');
		return cb();
	}
	logger.info('Lint application code');
	lint(exports.getRootPath(), config.get('lint.ignore'), function __onLint(error) {
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
	cluster.start(clusterConfig, function __clusterStarted() {
		if (cluster.isCluster()) {
			log.setPrefix(
				(cluster.isMaster() ? 'MASTER' : 'WORKER') +
				':' + process.pid +
				(cluster.id() ? ' ' + cluster.id() : '') 
			);
		}
		cb();
	});
}

function setupLog(cb) {
	canWrite(config.get('log') || {}, function __setupLogDone(error) {
		if (error) {
			return cb(
				new Error(
					ER_NOT_WRITABLE + ' ' +
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
	fs.exists(conf.file, function __logExists(exists) {
		if (!exists) {
			return cb(new Error(ER_LOG_DIR_NOT_FOUND + ' ' + conf.file));
		}
		fs.open(conf.file, 'w', function __canOpenLogFile(error, fd) {
			if (error) {
				switch (error.code) {
					case 'EISDIR':
						// if we can write a file here, it is good to go
						fs.writeFile(conf.file + '/.__', '', function (error) {
							if (error) {
								return cb(error);
							}
							fs.unlink(conf.file + '/.__', function () {
								// we ignore error here...
								cb();
							});
						});
						return;
					default:
						cb(error);
						return;
				}
			}
			fs.close(fd, function __closeLogFile(error) {
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
	cluster.onExit(function __clusterOnExit(next) {
		logger.verbose('Cleaning up logging before exit');
		log.forceFlush(function __onLogForceFlush() {
			log.clean(next);
		});
	});
	cb();
}

function startMod(cb) {
	mod.start(exports, config.get(), exports.onExit, function __onModStart(error) {
		if (error) {
			return cb(error);
		}
		cb();
	});
}

function setupRender(cb) {
	if (renderConf) {
		logger.info('Pre-render template files in', renderConf);
		const start = Date.now();
		render.config(renderConf.path, renderConf.cacheSize);
		render.setup(function __onRenderSetup(error) {
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

function setupSession(cb) {
	session.setup();
	cb();
}

function startHTTP(cb) {
	const host = config.get('http.host') || config.get('router.host');
	const port = config.get('http.port') || config.get('router.port');
	if (!cluster.isMaster() && host && port) {
		exports.http.setup(cb);
		return;
	}
	if (cluster.isMaster() && host && port) {
		logger.verbose('Master process does not start HTTP server');
	}
	cb();
}

function startUDP(cb) {
	if (!cluster.isMaster() && config.get('udp')) {
		exports.udp.setup(cb);
		return;
	}
	if (cluster.isMaster() && config.get('udp')) {
		logger.verbose('Master process does not start UDP server');
	}
	cb();
}

function startRPC(cb) {
	if (!cluster.isMaster() && config.get('rpc')) {
		exports.rpc.setup(cb);
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
	for (const key in opt) {
		if (!origin.hasOwnProperty()) {
			origin[key] = opt[key];
		}
	}
	return origin;
}

function requireInternal(path) {
	return require(__dirname + '/' + path);
}

'use strict';

const ER_NOT_WRITABLE = '<NOT_WRITABLE>';
const ER_LOG_DIR_NOT_FOUND = '<LOG_DIR_NOT_FOUND>';

const fs = require('fs');
const log = require('gracelog');
const aeterno = require('aeterno');
const cluster = require('cluster-mode');
const rootPath = getRootPath(require('./parent').getTopmostParent());
const config = requireInternal('./config');
const env = requireInternal('./env');
const mod = requireInternal('./mod');
const render = requireInternal('../render');
const lint = requireInternal('../lint');
const session = requireInternal('../session');
const async = requireInternal('../../lib/async');
const pkg = requireInternal('../../package.json');
const transport = requireInternal('../../lib/transport');

const onExceptions = [];

// this will be overridden by logger in setupLog()
var ignoreLint = false;
var logger = console;
var renderConf;
var clusterConfig;
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
exports.setEnvPrefix = env.setPrefix;
exports.session = session;
exports.rpc = requireInternal('../rpc');
exports.udp = requireInternal('../udp');
exports.portal = requireInternal('../portal');
exports.cluster = cluster;
exports.getRootPath = _getRootPath;
exports.config = _config;
exports.getConfig = _getConfig;
exports.require = _require;
exports.onExit = _onExit;
exports.onException = _onException;
exports.use = _use;
exports.isMaster = _isMaster;
exports.isCluster = _isCluster;
exports.start = _start;
exports.stop = _stop;
exports.isSupportedVersion = _isSupportedVersion;

/*
* //////////////////////
* // DEPRECATED       //
* //////////////////////
*/
exports.router = exports.http;
exports.registerShutdownTask = _registerShutdownTask;

///////////////////////////////

/**
* ///////////////////////
* // Public Functions  //
* ///////////////////////
*/

/** @description Returns the root path of the application
* @returns {string}
*/
function _getRootPath() {
	return rootPath;
}

/** @description Sets configurations
* @params {object} obj - Configuration object
* @returns {undefined}
*/
function _config(obj) {
	config.load(obj);
}

/** @description Returns configurations as an object
* @params {string} name - Configuration property name:
*	can be dot separated
* @returns {object}
*/
function _getConfig(name) {
	return config.get(name);
}

/** @desctiption Requires with application root path
* @params {string} path - Path to the module
* @returns {object}
*/
function _require(path) {
	return require(_getRootPath() + path);
}

/** @description Registers a function to be executed on process stop
* @params {function} taskFunc - Function to be invoked on process stop
* @params {boolean} runOnMaster - If true, the function is invoked on
*	master process stop as well as child process(es)
* @returns {undefined}
*/
function _onExit(taskFunc, runOnMaster) {
	cluster.addShutdownTask(taskFunc, (runOnMaster) ? true : false);
}

/** @description Registers a function to be invoked
*	on uncaught exception
* @params {function} func
*	- Function to be executed on uncaught exception
* @returns {undefined}
*/
function _onException(func) {
	if (typeof func !== 'function') {
		throw new Error('InvalidOnExceptionCallback:' + func);
	}
	onExceptions.push(func);
}

/** @description Deprecated alias of .onExit
*
*/
function _registerShutdownTask(name, func) {
	const e = new Error('WARNING');
	logger.warn(
		'.registerShutdownTask() has been deprecated',
		'and should not be used.',
		'Use .onExit(taskFunction, *runOnMaster) instead',
		e.stack
	);	
	exports.onExit(func);
}

/** @description Adds a module to be bootstrapped in .start()
* @params {string} name - Module name
* @params {string|object} path
*	- Module path or required module object
* @params {object} options - Optional object
* @returns {undefined}
*/
function _use(name, path, options) { 
	if (typeof path === 'string') {
		path = rootPath + path;
	}
	mod.use(name, path, options);
}

/** @description Returns true
*	if the process is a master process
* @returns {boolean}
*/
function _isMaster() {
	return cluster.isMaster();
}

/** @description Returns true
*	if the process has been started as cluster
* @returns {boolean}
*/
function _isCluster() {
	return cluster.isCluster();
}

/** @description Starts application process
*	and bootstraps modules added by .use()
* @params {function} cb - Callback function
* @returns {undefined}
*/
function _start(cb) {
	const start = Date.now();
	applyConfig();
	aeterno.run(function aeternoRun() {
		const tasks = [
			setup,
			startCluster,
			setupLog,
			execLint,
			setupLogCleaner,
			setupPortal,
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
}

/** @description Stops application process
* @params {error=} error
*	- If given the process is stopped with an error
* @returns {undefined}
*/
function _stop(error) {
	const trace = new Error('Stop Call Trace');
	if (error) {
		logger.error(trace.stack);
		logger.error('.stop() has been invoked:', error);
	} else {
		logger.verbose(trace.stack.replace('Error', ''));
		logger.info('.stop() has been invoked');
	}
	cluster.stop(error);
}

/** @description Returns true if the node.js version used is supported
* @returns {boolean}
*/
function _isSupportedVersion() {
	return isSupportedVersion;
}

///////////////////////////////

/**
* ///////////////////////
* // Private Functions //
* ///////////////////////
*/

function applyConfig() {
	// if ENV variables are provided, handle them here
	const envmap = env.getEnv();
	if (envmap && envmap.CONF) {
		// load a configuration file from ENV
		config.load(require(envmap.CONF));
	}
	if (Object.keys(envmap).length) {
		var dump = config.dump();
		// try to replace placeholders in the configurations
		for (const name in envmap) {
			if (name === 'CONF') {
				continue;
			}
			const key = '\\{\\$' + name + '\\}';
			dump = dump.replace(new RegExp(key, 'g'), envmap[name]);
		}
		config.restore(dump);
	}
	// apply configurations
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
	fs.stat(conf.file, function __logExists(error) {
		if (error) {
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

function setupPortal(cb) {
	const conf = config.get('portal');
	if (conf && conf.enable) {
		module.exports.portal.config(conf);
		module.exports.portal.setup(cb);
		return;
	}
	cb();
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

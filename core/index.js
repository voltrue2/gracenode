'use strict';

var EventEmitter = require('events').EventEmitter;
var async = require('async');
var config = require('../modules/config');
var logger = require('../modules/log');
var log = logger.create('gracenode');
var util = require('util');
var gracefulWaitList = []; // list of tasks to be executed before shutting down gracenode

var Argv = require('./argv');
var Process = require('./process');
var Module = require('./module');

var debugMode = require('./debug');

// overwridden by calling _setLogCleaner from log module
// shutdown task for log module. this will be executed at the very end
var logCleaners = [];

module.exports.Gracenode = Gracenode;


function Gracenode() {
	EventEmitter.call(this);
	// listeners
	setupListeners(this);
	// variables
	var roots = findRoots();
	this._process = null;
	this._isReady = false;
	this._pid = null;
	this._isMaster = false;
	this._configPath = '';
	this._configFiles = [];
	this._appRoot = roots.app;
	this._root = roots.gracenode;
	// version check
	compareGracenodeVersion(this);
	// change the root path of the application
	process.chdir(this._appRoot);
	// set up to load default modules except for log module
	this._module = new Module(this, this._root);
	this._module.use('profiler');
	this._module.use('lib');
	this._argv = new Argv(this);
	// parse argv arguments
	this._argv.parse();
	// set up debug mode
	debugMode.setup(this);
}

util.inherits(Gracenode, EventEmitter);

Gracenode.prototype.registerShutdownTask = function (name, taskFunc) {
	if (typeof taskFunc !== 'function') {
		throw new Error('argument 2 must be a function');
	}
	log.verbose('graceful shutdown task for ' + name + ' has been registered');
	gracefulWaitList.push({ name: name, task: taskFunc });
};

Gracenode.prototype.send = function (msg, worker) {
	this._process.send(msg, worker);
};

Gracenode.prototype.require = function (path) {
	return require(this.getRootPath() + path);
};

Gracenode.prototype.getRootPath = function () {
	return this._appRoot;
};

Gracenode.prototype.isMaster = function () {
	return this._isMaster;
};

Gracenode.prototype.getProcessType = function () {
	var ret = {};
	ret.type = this._isMaster ? 'master' : 'worker';
	ret.pid = this._pid;
	return ret;
};

Gracenode.prototype.setConfigPath = function (configPath, useFullPath) {
	if (this._configPath) {
		throw new Error('cannot call .setConfigPath() more than once');
	}
	if (useFullPath) {
		this._configPath = configPath;
	} else {
		this._configPath = this._appRoot + configPath;
	}
	log.verbose('configuration path:', this._configPath);
};

Gracenode.prototype.setConfigFiles = function (fileList) {
	if (this._configFiles.length) {
		throw new Error('cannot call .setConfigFiles() more than once');
	}
	if (!Array.isArray(fileList)) {
		throw new Error('.setConfigFiles() expects an array of configuration file names');
	}
	if (!fileList.length) {
		throw new Error('.setConfigFiles() must have configuration files before calling .setup()');
	}
	this._configFiles = fileList;
	log.verbose('configuration file list:', fileList);
};

Gracenode.prototype.addModulePath = function (path) {
	this._module.addModulePath(path);
};

Gracenode.prototype.exit = function (error) {
	this._shutdown(error || 0);
};

Gracenode.prototype.use = function (modName, driver) {
	this._module.use(modName, driver);
};

Gracenode.prototype.argv = function (key) {
	return this._argv.get(key);
};

Gracenode.prototype.defineOption = function (argName, description, argAsArray, callback) {
	this._argv.defineOption(argName, description, argAsArray, callback);
};

Gracenode.prototype.exitOnBadOption = function () {
	this._argv.exitOnBadOption();
};

Gracenode.prototype.setup = function (cb) {
	var that = this;
	if (!this._configPath) {
		console.error('<error>[gracenode] path to configuration files not set: call .setConfigPath() before calling .setup()');
		return cb(new Error('path to configuration files is missing'));
	}
	if (!this._configFiles.length) {
		console.error('<error>[gracenode] no configuration files to load');
		return cb(new Error('no configuration files given: call .setConfigFiles() before calling .setup()'));
	}
	// set up argv
	this._argv.setup();
	// set up config
	var error = setupConfig(this);
	if (error) {
		return cb(error);
	}
	// final callback to be called when gracenode is ready
	var done = function (error) {
		if (error) {
			log.fatal('gracenode failed to set up');
			return that.exit(error);
		}

		that._isReady = true;

		log.verbose('gracenode set up complete [' + that._isReady + ']');

		that.emit('setup.complete');

		that._argv.execDefinedOptions();
		
		cb();

		that._profiler.stop();
	
	};
	// start gracenode
	var starter = function (callback) {
		log.verbose('gracenode is starting...');
		callback(null, that, done);
	};
	// executes only --debug is given
	var debugRun = function (that, callback) {
		debugMode.exec(function (error) {
			if (error) {
				log.fatal('gracenode debug mode detected error(s)');
				return that.exit(error);
			}
			callback(null, that);
		});
	};
	var setupList = [
		starter, 
		setupLog, 
		setupProfiler,
		setupProcess,
		debugRun,
		setupModules
	];
	async.waterfall(setupList, done);
};

// deprecated as of Nov/4/2014 version 1.3.3
// finds a schema.sql under given module's directory
// never use this function in production, but setup script only
Gracenode.prototype.getModuleSchema = function (modName, cb) {
	this._module.getModuleSchema(modName, cb);
};

// internal use only for log module
Gracenode.prototype._addLogCleaner = function (name, func) {
	var cleaner = function (done) {
		func(function (error) {
			if (error) {
				log.error(error);
			}
			done();
		});
	};
	logCleaners.push(cleaner);
};

// internal use only by core index
Gracenode.prototype._shutdown = function (error) {
	log.info('shutting down gracenode...');
	var that = this;
	handleShutdownTasks(that, function () {
		if (error) {
			log.fatal('exit gracenode with an error:', error);
		}
		log.info('Bye');
		async.eachSeries(logCleaners, function (cleaner, next) {
			cleaner(next);
		},
		function () {
			process.exit(error ? 1 : 0);
		});
	});
};

/* 
extracts application's expected gracenode version
and compare the version it against the currently installed gracenode version

* if the installed version is lower than excepted version, .setup() fails
*/
function compareGracenodeVersion(that) {
	var appPackage;
	try {
		appPackage = require(that._appRoot + 'package.json');
	} catch (e) {
		// there seems to be no package.json present. we do nothing
		return;
	}
	// extract application's expected gracenode version
	if (appPackage.dependencies && appPackage.dependencies.gracenode) {
		var expectedVersion = appPackage.dependencies.gracenode.replace(/(>|<|=|\ )/g, '');
		var gnPackage = require(that._root + '/package.json');
		var currentVersion = gnPackage.version;
		// isNaN() returns true if the given argument is a string float
		if (!isNaN(expectedVersion.replace(/\./g, '')) && expectedVersion > currentVersion) {
			// application is expecting installed gracenode to be higher version than the currently installed version
			return that.exit(new Error('application is expecting gracenode to be ' + expectedVersion + ' or higher, but installed gracenode is ' + currentVersion));
		}
	}
}

function findRoots() {
	var appRoot;
	var root;
	// find app root path
	// remove core directory name from the path
	var path = __dirname;
	root = path.replace('/core', '');
	// remove gracenode directory name from the path
	appRoot = root.substring(0, root.lastIndexOf('/'));
	// if there is node_modules directory, remove it from the path
	var index = appRoot.indexOf('node_modules');
	if (index !== -1) {
		appRoot = appRoot.substring(0, index);
	}
	if (appRoot.substring(appRoot.length - 1) !== '/') {
		appRoot += '/';
	}
	if (root.substring(root.length - 1) !== '/') {
		root += '/';
	}
	// find gracenode root path
	return { app: appRoot, gracenode: root };
}

function setupConfig(that) {
	config.setPath(that._configPath);
	var error = config.load(that._configFiles);
	if (error) {
		log.fatal('gracenode failed to read configurations:', error, error.stack);
	}
	that.config = config;
	log.verbose('config is ready');
	that.emit('setup.config');
	return error;
}

function setupLog(that, lastCallback, cb) {
	var conf = config.getOne('modules.log');
	logger.gracenode = that;
	logger.readConfig(conf);
	logger.setup(function (error) {
		if (error) {
			return lastCallback(error);
		}
		log.config = conf;
		that.log = logger;
		
		log.verbose('log is ready');

		that.emit('setup.log');

		cb(null, that, lastCallback);
	});
}

function setupProfiler(that, lastCallback, cb) {
	var profiler = require('../modules/profiler');
	// gracenode profiler
	that._profiler = profiler.create(that._root);
	that._profiler.start();	

	log.verbose('profiler is ready');

	that.emit('setup._profiler');

	cb(null, that, lastCallback);	
}

function setupProcess(that, lastCallback, cb) {
	var ps = new Process(that);
	that._process = ps;	
	ps.on('cluster.master.setup', function (pid) {
		that._pid = pid;
		logger._setInternalPrefix('MASTER:' + pid);
		log = logger.create('gracenode');
		lastCallback();
	});
	ps.on('cluster.worker.setup', function (pid) {
		that._pid = pid;
		logger._setInternalPrefix('WORKER:' + pid);
		log = logger.create('gracenode');
		cb(null, that);
	});
	ps.on('nocluster.setup', function () {
		cb(null, that);
	});
	ps.setup();
}

function setupModules(that, cb) {
	log.verbose('application configuration path:', that._configPath);
	log.verbose('application configuration files:', that._configFiles);
	log.verbose('application configurations:', JSON.stringify(that.config.getAll(), null, 4));	
	that._module.load(cb);
}

function handleShutdownTasks(that, cb) {
	if (!gracefulWaitList.length) {
		return cb();
	}
	// execute shutdown tasks
	async.eachSeries(gracefulWaitList, function (item, next) {
		log.info('handling graceful exit task for', item.name);
		try {
			item.task(function (error) {
				if (error) {
					log.error('shutdown task <' + item.name + '>', error);
				}
				that.emit('shutdown.' + item.name);
				next();
			});
		} catch (e) {
			log.fatal('shutdown task <' + item.name + '>', e);
			next();
		}
	},
	function () {
		gracefulWaitList = [];
		log.info('all shutdown tasks have been executed');
		cb();
	});
}

function setupListeners(that) {
	
	process.on('uncaughtException', function (error) {
		log.fatal('gracenode detected an uncaught exception:', error, error.stack);
		that.emit('uncaughtException', error);
		if (!that._isReady) {
			// something went wrong before gracenode is ready
			log.error('gracenode failed to set up due to a fatal error');
			that.exit(error);
		}
	});

}

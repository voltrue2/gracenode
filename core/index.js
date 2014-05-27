var EventEmitter = require('events').EventEmitter;
var async = require('async');
var config = require('../modules/config');
var logger = require('../modules/log');
var log = logger.create('gracenode');
var util = require('util');
var gracefulWaitList = []; // list of tasks to be executed before shutting down gracenode

var Process = require('./process');
var Module = require('./module');

// overwridden by calling _setLogCleaner from log module
// shutdown task for log module. this will be executed at the very end
var logCleaners = [];

module.exports.Gracenode = Gracenode;

function Gracenode() {
	EventEmitter.call(this);
	// listeners
	setupListeners(this);
	// variables
	this._pid = null;
	this._isMaster = false;
	this._configPath = '';
	this._configFiles = [];
	var roots = findRoots();
	this._appRoot = roots.app;
	this._root = roots.gracenode;
	process.chdir(this._appRoot);
	console.log('Working directory changed to', this._appRoot);
	console.log('gracenode root path:', this._root);
	this._module = new Module(this, this._root);
	this._module.use('profiler');
	this._module.use('lib');
}

util.inherits(Gracenode, EventEmitter);

Gracenode.prototype.registerShutdownTask = function (name, taskFunc) {
	if (typeof taskFunc !== 'function') {
		return log.error('argument 2 must be a function');
	}
	log.info('graceful shutdown task for ' + name + ' has been registered');
	gracefulWaitList.push({ name: name, task: taskFunc });
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

Gracenode.prototype.setConfigPath = function (configPath) {
	this._configPath = this._appRoot + configPath;
	log.verbose('configuration path:', this._configPath);
};

Gracenode.prototype.setConfigFiles = function (fileList) {
	this._configFiles = fileList;
	log.verbose('configuration file list:', fileList);
};

Gracenode.prototype.addModulePath = function (path) {
	this._module.addModulePath(path);
};

Gracenode.prototype.exit = function (error) {
	this.emit('exit', error || 0);
};

Gracenode.prototype.override = function (builtInModuleName) {
	this._module.override(builtInModuleName);
};

Gracenode.prototype.use = function (modName, driver) {
	this._module.use(modName, driver);
};

Gracenode.prototype.setup = function (cb) {
	if (!this._configPath) {
		return this.exit(new Error('path to configuration files not set'));
	}
	if (!this._configFiles.length) {
		return this.exit(new Error('configuration files not set'));
	}
	var that = this;
	var starter = function (callback) {
		log.verbose('gracenode is starting...');
		callback(null, that, cb);
	};
	var setupList = [
		starter, 
		setupConfig, 
		setupLog, 
		setupProfiler,
		setupProcess, 
		setupModules
	];
	async.waterfall(setupList, function (error) {
		if (error) {
			log.fatal(error);
			log.fatal('gracenode failed to set up');
			return that.exit(error);
		}

		log.verbose('gracenode set up complete');

		that.emit('setup.complete');
		
		cb();

		that._profiler.stop();
	});
};

// finds a schema.sql under given module's directory
// never use this function in production, but setup script only
Gracenode.prototype.getModuleSchema = function (modName, cb) {
	this._module.getModuleSchema(modName, cb);
};

// internal use only
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
		appRoot = appRoot.replace('node_modules', '');
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

function setupConfig(that, lastCallback, cb) {
	config.setPath(that._configPath);
	config.load(that._configFiles, function (error) {
		if (error) {
			return cb(error);
		}
		that.config = config;

		log.verbose('config is ready');

		that.emit('setup.config');

		cb(null, that, lastCallback);
	});
}

function setupLog(that, lastCallback, cb) {
	logger.gracenode = that;
	logger.readConfig(config.getOne('modules.log'));
	logger.setup(function (error) {
		if (error) {
			return lastCallback(error);
		}
		log.config = config.getOne('modules.log');
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

	// profiler for others
	that.profiler = profiler;

	log.verbose('profiler is ready');

	that.emit('setup._profiler');

	cb(null, that, lastCallback);	
}

function setupProcess(that, lastCallback, cb) {
	var ps = new Process(that);
	ps.on('cluster.master.setup', function (pid) {
		that._pid = pid;
		logger.setPrefix('MASTER:' + pid);
		log = logger.create('gracenode');
		lastCallback();
	});
	ps.on('cluster.worker.setup', function (pid) {
		that._pid = pid;
		logger.setPrefix('WORKER:' + pid);
		log = logger.create('gracenode');
		cb(null, that);
	});
	ps.on('nocluster.setup', function () {
		cb(null, that);
	});
	ps.setup();	
}

function setupModules(that, cb) {
	that._module.load(cb);
}

function handleShutdownTasks(cb) {
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

	that.on('exit', function (error) {
		log.info('exit caught: shutting down gracenode...');
		handleShutdownTasks(function () {
			if (error) {
				log.fatal('exit gracenode with an error:', error);
			}
			async.eachSeries(logCleaners, function (cleaner, next) {
				cleaner(next);
			},
			function () {
				log.info('exit gracenode');
				process.exit(error ? 1: 0);
			});
		});
	});
	
	process.on('uncaughtException', function (error) {
		log.fatal('gracenode detected an uncaught exception', error);
		that.emit('uncaughtException', error);
	});

	process.on('SIGINT', function () {
		log.info('SIGINT caught: shutting down gracenode...');
		handleShutdownTasks(function () {
			that.emit('shutdown');
			that.exit();
		});
	});

	process.on('SIGQUIT', function () {
		log.info('SIGQUIT caught: shutting down gracenode...');
		handleShutdownTasks(function () {
			that.emit('shutdown');
			that.exit();
		});
	});

	process.on('SIGTERM', function () {
		log.info('SIGTERM caught: shutting down gracenode...');
		handleShutdownTasks(function () {
			that.emit('shutdown');
			that.exit();
		});
	});
}

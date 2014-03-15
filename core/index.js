var rootDirName = 'node_modules/GraceNode';
var EventEmitter = require('events').EventEmitter;
var async = require('async');
var config = require('../modules/config');
var logger = require('../modules/log');
var log = logger.create('GraceNode');
var util = require('util');
var cluster = require('cluster');
var fs = require('fs');
var modPaths = [];
var workerList = []; // master only
var gracefulWaitList = []; // list of tasks to be executed before shutting down GraceNode

module.exports.GraceNode = GraceNode;

function GraceNode() {
	EventEmitter.call(this);
	// listeners
	setupListeners(this);
	// variables
	this._isMaster = false;
	this._configPath = '';
	this._configFiles = [];
	this._modules = [
		{ name: 'profiler', sourceName: 'profiler', config: null, path: null },
		{ name: 'lib', sourceName: 'lib', config: null, path: null }
	];
	this._root = __dirname.substring(0, __dirname.lastIndexOf(rootDirName));
	process.chdir(this._root);
	log.verbose('Working directory changed to', this._root);
}

util.inherits(GraceNode, EventEmitter);

GraceNode.prototype.registerShutdownTask = function (name, taskFunc) {
	if (typeof taskFunc !== 'function') {
		return log.error('argument 2 must be a function');
	}
	log.info('graceful shutdown task for ' + name + ' has been registered');
	gracefulWaitList.push({ name: name, task: taskFunc });
};

GraceNode.prototype.require = function (path) {
	return require(this.getRootPath() + path);
};

// finds a schema.sql under given module's directory
// never use this function in production, but setup script only
GraceNode.prototype.getModuleSchema = function (modName, cb) {
	var prefix = this.getRootPath();
	var pathList = [rootDirName + '/modules/'];
	pathList = pathList.concat(modPaths);
	async.eachSeries(pathList, function (path, callback) {
		var filePath = prefix + path + modName + '/schema.sql';
		log.verbose('looking for ' + filePath);	
		fs.exists(filePath, function (exists) {
			if (exists) {
				log.verbose(filePath + ' found');
				fs.readFile(filePath, 'utf-8', function (error, sql) {
					if (error) {
						return cb(error);
					}

					log.verbose('module schema:', sql);

					// remove line breaks and tabs
					sql = sql.replace(/(\n|\t)/g, '');
					// separate sql statements
					var sqlList = sql.split(';');
					// remove empty entry in the array
					var list = [];
					for (var i = 0, len = sqlList.length; i < len; i++) {
						if (sqlList[i] !== '') {
							list.push(sqlList[i]);
						}
					}

					log.verbose('module schema queries:', list);

					cb(null, list);
				});
				return;
			}
			callback();
		});
	},
	function () {
		log.verbose(modName + ' schema.sql not found');
		cb(null, []);
	});
};

GraceNode.prototype.getRootPath = function () {
	return this._root;
};

GraceNode.prototype.isMaster = function () {
	return this._isMaster;
};

GraceNode.prototype.setConfigPath = function (configPath) {
	this._configPath = this._root + configPath;
	log.verbose('configuration path:', this._configPath);
};

GraceNode.prototype.setConfigFiles = function (fileList) {
	this._configFiles = fileList;
	log.verbose('configuration file list:', fileList);
};

GraceNode.prototype.addModulePath = function (path) {
	if (modPaths.indexOf(path) !== -1) {
		return log.warning('module path has already been added:', path);
	}
	modPaths.push(path);
	log.verbose('module path has been added:', path);
};

GraceNode.prototype.exit = function (error) {
	this.emit('exit', error || 0);
};

GraceNode.prototype.use = function (modName) {
	this._modules.push({
		name: modName
	});
};

GraceNode.prototype.setup = function (cb) {
	if (!this._configPath) {
		return this.exit(new Error('path to configuration files not set'));
	}
	if (!this._configFiles.length) {
		return this.exit(new Error('configuration files not set'));
	}
	var that = this;
	var starter = function (callback) {
		log.verbose('GraceNode is starting...');
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
			log.fatal('GraceNode failed to set up');
			return that.exit(error);
		}

		log.verbose('GraceNode set up complete');

		that.emit('setup.complete');
		
		cb();

		that._profiler.stop();
	});
};

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
	logger.readConfig(config.getOne('modules.log'));
	that.log = logger;

	log.verbose('log is ready');

	that.emit('setup.log');

	cb(null, that, lastCallback);
}

function setupProfiler(that, lastCallback, cb) {
	var profiler = require('../modules/profiler');

	// GraceNode profiler
	that._profiler = profiler.create(rootDirName);
	that._profiler.start();	

	// profiler for others
	that.profiler = profiler;

	log.verbose('profiler is ready');

	that.emit('setup._profiler');

	cb(null, that, lastCallback);	
}

function setupProcess(that, lastCallback, cb) {

	log.verbose('setting up process...');
	
	var enabled = that.config.getOne('cluster.enable');
	var CPUNum = require('os').cpus().length;
	var maxClusterNum = that.config.getOne('cluster.max') || 0;
	var max = Math.min(maxClusterNum, CPUNum);

	log.verbose('maximum possible number of process to spawn: ' + max);
	
	if (cluster.isMaster && max && enabled) {
		
		// master process	

		that.log.setPrefix('MASTER: ' + process.pid);	
		log.info('in cluster mode [master]: number of CPU > ' + CPUNum + ' >> number of workers to be spawned: ' + max);
		log.info('(pid: ' + process.pid + ')');

		for (var i = 0; i < max; i++) {
			var worker = cluster.fork();
			workerList.push(worker);
			log.info('worker spawned: (pid: ' + worker.process.pid + ')');
		}

		that._isMaster = true;

		// set up termination listener
		cluster.on('exit', function (worker, code, sig) {
			workerList.splice(workerList.indexOf(worker), 1);
			log.error('worker has died: (pid: ' + worker.process.pid + ') [signal: ' + sig + '] ' + code);
		});

		that.on('shutdown', function (signal) {
			log.info('shutdown all workers');
			for (var i = 0, len = workerList.length; i < len; i++) {
				process.kill(workerList[i].process.pid, signal);
				log.info('worker has been killed: (pid: ' + workerList[i].process.pid + ')');
			}
		});
	
		// we stop here
		lastCallback();
	
	} else if (max && enabled) {
		
		// worker process

		that.log.setPrefix('WORKER: ' + process.pid);
		log.info('in cluster mode [worker] (pid: ' + process.pid + ')');
	
		cb(null, that);

	} else {
	
		// none-cluster mode
		log.info('in none-cluster mode: (pid: ' + process.pid + ')');		

		cb(null, that);

	}
	
}

function loadModule(that, mod, cb) {
	var name = mod.name;
	try {
		// first try inside GraceNode
		var path = that.getRootPath() + rootDirName + '/modules/' + mod.name;
		fs.exists(path, function (exists) {
			log.verbose('look for module [' + name + '] in ', path);
			if (exists) {
				log.verbose('module [' + name + '] found');
				return cb(null, require(path));
			}
			// try other path(s)
			async.eachSeries(modPaths, function (dir, callback) {
				dir = that.getRootPath() + dir + name;
				fs.exists(dir, function (exists) {
					log.verbose('look for module [' + name + '] in ', dir);
					if (exists) {
						log.verbose('module [' + name + '] found');
						return cb(null, require(dir));
					}
					callback();
				});
			}, cb);
		});
	} catch (exception) {
		cb(exception);
	}
}

function setupModules(that, cb) {
	log.verbose('start loading built-in modules');
	async.eachSeries(that._modules, function (mod, nextCallback) {
		
		var name = mod.name;

		loadModule(that, mod, function (error, module) {

			if (error) {
				return cb(error);
			}

			if (!module) {
				return cb(new Error('failed to find module [' + name + ']'));
			}

			that[name] = module;

			if (typeof module.readConfig === 'function') {
				log.verbose('module [' + name + '] reading configurations: modules.' + name);
				var status = module.readConfig(config.getOne('modules.' + name));
				if (status instanceof Error) {
					return cb(status);
				}
			}
		
			if (typeof module.setup === 'function') {
				module.setup(function (error) {
					if (error) {
						return cb(error);
					}
					that._profiler.mark('module [' + name + '] loaded');
					log.verbose('module [' + name + '] loaded');
					that.emit('setup.' + name);
					nextCallback();
				});
			} else {
				that._profiler.mark('module [' + name + '] loaded');
				log.verbose('module [' + name + '] loaded');
				that.emit('setup.' + name);
				nextCallback();
			}
		});
	}, cb);
}

function handleShutdownTasks(cb) {
	if (!gracefulWaitList.length) {
		return cb();
	}
	async.eachSeries(gracefulWaitList, function (item, next) {
		log.info('handling graceful exit task for ', item.name);
		item.task(next);
	},
	function () {
		gracefulWaitList = [];
		log.info('all shutdown tasks have been executed');
		cb();
	});
}

function setupListeners(that) {

	that.on('exit', function (error) {
		log.info('exit caught: shutting down GraceNode...');
		handleShutdownTasks(function () {
			if (error) {
				return log.fatal('exit GraceNode with an error:', error);
			}
			log.info('exit GraceNode');
			process.exit(error);
		});
	});
	
	process.on('uncaughtException', function (error) {
		log.fatal('GraceNode detected an uncaught exception');
		log.fatal(error);
		that.emit('uncaughtException', error);
	});

	process.on('SIGINT', function () {
		log.info('SIGINT caught: shutting down GraceNode...');
		handleShutdownTasks(function () {
			log.info('shutdown GraceNode');
			that.emit('shutdown');
			that.exit();
		});
	});

	process.on('SIGQUIT', function () {
		log.info('SIGQUIT caught: shutting down GraceNode...');
		handleShutdownTasks(function () {
			log.info('quit GraceNode');
			that.emit('shutdown');
			that.exit();
		});
	});

	process.on('SIGTERM', function () {
		log.info('SIGTERM caught: shutting down GraceNode...');
		handleShutdownTasks(function () {
			log.info('terminate GraceNode');
			that.emit('shutdown');
			that.exit();
		});
	});
}

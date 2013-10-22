
var rootDirName = 'GraceNode';
var EventEmitter = require('events').EventEmitter;
var async = require('async');
var config = require('../modules/config');
var logger = require('../modules/log');
var log = logger.create('GraceNode');
var util = require('util');

module.exports.GraceNode = GraceNode;

function GraceNode() {
	EventEmitter.call(this);
	// listeners
	setupListeners(this);
	// variables
	this._configPath = '';
	this._configFiles = [];
	this._modules = [
		{ name: 'profiler', sourceName: 'profiler', config: null, path: null },
		{ name: 'lib', sourceName: 'lib', config: null, path: null }
	];
	this._root = __dirname.substring(0, __dirname.lastIndexOf(rootDirName));
	// detect current working directory directory
	var prevCwd = process.cwd();
	// change current working directory to the root of the application
	process.chdir(this._root);
	log.verbose('cwd changed: ' + prevCwd + ' > ' + this._root);
}

util.inherits(GraceNode, EventEmitter);

GraceNode.prototype.getRootPath = function () {
	return this._root;
};

GraceNode.prototype.setConfigPath = function (configPath) {
	this._configPath = this._root + configPath;
	log.verbose('configuration path:', this._configPath);
};

GraceNode.prototype.setConfigFiles = function (fileList) {
	this._configFiles = fileList;
	log.verbose('configuration file list:', fileList);
};

GraceNode.prototype.exit = function (error) {
	this.emit('exit', error || null);
	process.exit(error || 0);
};

GraceNode.prototype.use = function (modName, sourceModName, params) {
	if (!params) {
		params = {};
	}
	this._modules.push({
		name: modName,
		sourceName: sourceModName,
		config: params.configName || null,
		path: params.path || null
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
	var starter = function (cb) {
		log.verbose('GraceNode is starting...');
		cb(null, that);
	};
	var setupList = [
		starter, 
		setupConfig, 
		setupLog, 
		setupProfiler, 
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

		that.profiler.stop();
	});
};

function setupConfig(that, cb) {
	config.setPath(that._configPath);
	config.load(that._configFiles, function (error) {
		if (error) {
			return cb(error);
		}
		that.config = config;

		log.verbose('config is ready');

		that.emit('setup.config');

		cb(null, that);
	});
}

function setupLog(that, cb) {
	logger.readConfig(config.getOne('modules.log'));
	that.log = logger;

	log.verbose('log is ready');

	that.emit('setup.log');

	cb(null, that);
}

function setupProfiler(that, cb) {
	that.profiler = require('../modules/profiler');
	that.profiler.start();	

	log.verbose('profiler ready');

	that.emit('setup.profiler');

	cb(null, that);	
}

function setupModules(that, cb) {
	log.verbose('start loading built-in modules');
	try {
		async.eachSeries(that._modules, function (mod, nextCallback) {
			var name = mod.name;
			var source = mod.sourceName;
			var dir = that.getRootPath() + rootDirName + '/' + (mod.path || 'modules/');
			var path = dir + name;
			var configName = 'modules.' + (mod.config || name);
			
			var module = require(path);
		
			that[name] = module;			

			log.verbose('module[' + name + '] loading...');

			if (typeof module.readConfig === 'function') {
				log.verbose('module[' + name + '] reading configurations: ' + configName);
				var status = module.readConfig(config.getOne(configName));
				if (status instanceof Error) {
					return cb(status);
				}
			}
		
			if (typeof module.setup === 'function') {
				module.setup(function (error) {
					if (error) {
						return cb(error);
					}
					that.profiler.mark('module[' + name + '] loaded');
					that.emit('setup.' + name);
					nextCallback();
				});
			} else {
				that.profiler.mark('module[' + name + '] loaded');
				that.emit('setup.' + name);
				nextCallback();
			}
		}, cb);
	} catch (e) {
		cb(e);
	}
}

function setupListeners(that) {
	
	process.on('uncaughtException', function (error) {
		log.fatal('GraceNode detected an uncaught exception');
		log.fatal(error);
		that.emit('uncaughtException');
	});

	process.on('exit', function (error) {
		that.emit('exit', error);
		if (error) {
			return log.fatal('exit GraceNode with an error');
		}
		log.info('exit GraceNode');
	});

	process.on('SIGINT', function () {
		log.verbose('shutdown GraceNode');
		that.emit('shutdown');
		that.exit();
	});
}

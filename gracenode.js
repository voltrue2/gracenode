
// bootstraps modules

var GraceNode = 'GraceNode';

var modules = [
	{ name: 'profiler', sourceName: 'profiler', config: null, path: null },
	{ name: 'lib', sourceName: 'lib', config: null, path: null }
];

var EventEmitter = require('events').EventEmitter;
var async = require('async');
var config = require('./modules/config');
var logger = require('./modules/log');
var log = logger.create('GraceNode');
var profiler = null;
var eventEmitter = new EventEmitter();

// exposed properties
configPath = '';
configFiles = [];
module.exports.event = new EventEmitter();

var prevCwd = process.cwd();
var appRoot = __dirname.substring(0, __dirname.lastIndexOf(GraceNode));

// change current working dir to the root of the application
process.chdir(appRoot);

/*
* returns the application root path
*/ 
module.exports.getRootPath = function () {
	return appRoot;
};

module.exports.exit = function (error) {
	process.exit(error || 0);
};

module.exports.setConfigPath = function (path) {
	configPath = path;
	log.verbose('configuration path: ', configPath);
};

module.exports.setConfigFiles = function (configFileList) {
	if (!Array.isArray(configFileList)) {
		log.fatal('invalid configuration file list given (an array expected): ', configFileList);
		return module.exports.exit(1); 
	}	
	configFiles = configFileList;
	log.verbose('configuration file list set: ', configFileList);
};

/**
 * @param {String} name of the module to be used. example: modName = myServer -> GraceNode.myServer
 * @param {String} original name of the module to be used. example modSourceName = server -> load module called "server"
 * @param {Object} { altConfigName: alternative configuration name of be used, altPath: alternative path to the module }
 * */
module.exports.use = function (modName, sourceModName, params) {
	if (!params) {
		params = {};
	}	
	modules.push({ name: modName, sourceName: sourceModName, config: params.altConfigName || null, path: params.altPath || null });
};

module.exports.setup = function (cb) {
	if (!configPath) {
		return cb(new Error('configPath has not been set'));
	}
	if (!configFiles.length) {
		return cb(new Error('configuration files to load have not been set'));
	}
	// set up process
	var setupList = [setupConfig, setupLog, setupProfiler, setupModules];
	async.waterfall(setupList, function (error) {
		if (error) {
			log.fatal(error);
			log.fatal('GraceNode failed to setup');
			process.exit(1);
		}

		log.verbose('GraceNode setup complete');

		cb();
	
		profiler.stop();
	});
};

// set up process functions
function setupConfig(callback) {
	config.setPath(configPath);
	config.load(configFiles, function (error) {
		if (error) {
			console.error(error);
			console.trace();
			return callback(error);
		}
		// add as a module
		module.exports.config = config;

		callback(error);
	});
}

function setupLog(callback) {
	logger.readConfig(config.getOne('modules.log'));
	// add as a module
	module.exports.log = logger;

	callback(null);

	log.verbose('logging setup complete');
	log.verbose('start GraceNode');
	log.verbose('application root path: ', appRoot);
	log.verbose('changed the current working directory: ', prevCwd + ' -> ' + process.cwd());
}

function setupProfiler(callback) {
	profiler = require('./modules/profiler');	
	module.exports.profiler = profiler;
	callback(null);
	
	log.verbose('profiler setup');

	profiler.start();
}

function setupModules(callback) {
	log.verbose('start setting up modules to be used...');

	try {
		async.eachSeries(modules, function (module, nextCallback) {
			var name = module.name;
			var source = module.sourceName;
			var dir = module.path || './modules/';
			var path = dir + name;
			var configName = module.config || name;
			configName = 'modules.' + configName;

			// require module and add it
			exports[name] = require(path);

			// pass the name of module
			exports[name].name = name;
			
			// if module has readConfig function, call it
			if (typeof exports[name].readConfig === 'function') {

				log.verbose('module [' + name + '] reading configurations: ' + configName);

				var status = exports[name].readConfig(config.getOne(configName));
				// check for config read error
				if (status instanceof Error) {
					return callback(status);
				}
			}

			log.verbose('module [' + name + '] loaded');

			// if the module has setup function, call it
			if (typeof exports[name].setup === 'function') {
				
				log.verbose('module [' + name + '] setting up');
				
				exports[name].setup(function (error) {
					
					log.verbose('module [' + name + '] set up complete');

					profiler.mark('module [' + name + '] load');
					
					nextCallback(error);
				});
			} else {

				profiler.mark('module [' + name + '] load');
				
				nextCallback();
			}
		},
		function (error) {
			callback(error);
		});

	} catch (error) {
		callback(error);
	}
}

// uncaught exception handler
process.on('uncaughtException', function (error) {
	log.fatal('GraceNode detected an uncaught exception');
	module.exports.event.emit('uncaughtException', error);
	log.fatal(error);
});

// signal event listener

process.on('exit', function (error) {
	module.exports.event.emit('exit', error);
	
	if (error) {
		log.fatal('exit GraceNode with an error');
	} else {
		log.verbose('exit GraceNode');
	}
});

process.on('SIGINT', function () {
	log.verbose('shutdown GraceNode');
	module.exports.event.emit('shutdown');
	process.exit(0);
});

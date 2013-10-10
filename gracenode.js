
// bootstraps modules

var GraceNode = 'GraceNode';

var modules = [
	{ name: 'profiler', sourceName: 'profiler', config: null, path: null },
	{ name: 'util', sourceName: 'util', config: null, path: null }
];

var EventEmitter = require('events').EventEmitter;
var async = require('async');
var config = require('./modules/config');
var logger = require('./modules/log');
var log = logger.create('GraceNode');
var profiler = null;
var eventEmitter = new EventEmitter();

// exposed properties
exports.configPath = '';
exports.configFiles = [];
exports.event = new EventEmitter();

var prevCwd = process.cwd();
var appRoot = __dirname.substring(0, __dirname.lastIndexOf(GraceNode));

// change current working dir to the root of the application
process.chdir(appRoot);

/**
 * @param {String} name of the module to be used. example: modName = myServer -> GraceNode.myServer
 * @param {String} original name of the module to be used. example modSourceName = server -> load module called "server"
 * @param {Object} { altConfigName: alternative configuration name of be used, altPath: alternative path to the module }
 * */
exports.use = function (modName, sourceModName, params) {
	if (!params) {
		params = {};
	}	
	modules.push({ name: modName, sourceName: sourceModName, config: params.altConfigName || null, path: params.altPath || null });
};

exports.setup = function (cb) {
	if (!exports.configPath) {
		return cb(new Error('configPath has not been set'));
	}
	if (!exports.configFiles.length) {
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

		cb();

		log.verbose('GraceNode setup complete');
	
		profiler.stop();
	});
};

// set up process functions
function setupConfig(callback) {
	config.setPath(exports.configPath);
	config.load(exports.configFiles, function (error) {
		if (error) {
			console.error(error);
			console.trace();
			return callback(error);
		}
		// add as a module
		exports.config = config;

		callback(error);
	});
}

function setupLog(callback) {
	logger.readConfig(config.getOne('modules.log'));
	// add as a module
	exports.log = logger;

	callback(null);

	log.verbose('logging setup complete');
	log.verbose('start GraceNode');
	log.verbose('application root path: ', appRoot);
	log.verbose('changed the current working directory: ', prevCwd + ' -> ' + process.cwd());
}

function setupProfiler(callback) {
	profiler = require('./modules/profiler');	
	exports.profiler = profiler;
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

			profiler.mark('module [' + name + '] load');

			log.verbose('module [' + name + '] loaded');

			// if the module has setup function, call it
			if (typeof exports[name].setup === 'function') {
				
				log.verbose('module [' + name + '] setting up');
				
				exports[name].setup(function (error) {
					
					log.verbose('module [' + name + '] set up complete');
					
					nextCallback(error);
				});
			} else {
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
	exports.event.emit('uncaughtException', error);
	log.fatal(error);
});

// signal event listener

process.on('exit', function (error) {
	exports.event.emit('exit', error);
	
	if (error) {
		log.fatal('exit GraceNode with an error');
	} else {
		log.verbose('exit GraceNode');
	}
});

process.on('SIGINT', function () {
	log.verbose('shutdown GraceNode');
	exports.event.emit('shutdown');
	process.exit(0);
});

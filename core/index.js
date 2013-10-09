
// bootstraps modules

var modules = [];

var async = require('async');
var config = require('../modules/config');
var log = require('../modules/log');
var profiler = require('../modules/profiler');

exports.configPath = '';
exports.configFiles = [];

/**
 * @param {String} name of the module to be used. example: modName = myServer -> GraceNote.myServer
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
	var setupList = [setupProfiler, setupConfig, setupLog, setupModules];
	async.waterfall(setupList, function (error) {
		if (error) {
			log.fatal(error);
			log.fatal('GraceNote failed to setup');
			process.exit(1);
		}

		cb();
		
		log.verbose('GraceNote setup complete');
	
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

		profiler.mark('config setup');

		callback(error);
	});
}

function setupLog(callback) {
	log.readConfig(config.getOne('modules.log'));
	// add as a module
	exports.log = log;
	
	profiler.mark('log setup');

	callback(null);

	log.verbose('logging setup complete');
}

function setupProfiler(callback) {
	profiler.GraceNote = exports;
	exports.profiler = profiler;
	callback(null);
	
	log.verbose('profiler setup');

	profiler.start();
}

function setupModules(callback) {

	log.verbose('start setting up modules to be used...');

	try {
		for (var i = 0, len = modules.length; i < len; i++) {
			var name = modules[i].name;
			var source = modules[i].sourceName;
			var dir = modules[i].path || '../modules/';
			var path = dir + source;
			var configName = modules[i].config || name;
			configName = 'modules.' + configName;

			log.verbose('module [' + name + '] loading from ' + path);

			// require module and add it
			exports[name] = require(path);
			
			// pass itself to the module
			exports[name].GraceNote = exports;

			// pass the name of module
			exports[name].name = name;

			log.verbose('module [' + name + '] reading configurations: ' + configName);

			// check for configu read error
			var status = exports[name].readConfig(config.getOne(configName));
			if (status instanceof Error) {
				return callback(status);
			}

			profiler.mark('module [' + name + '] setup');

			log.verbose('module [' + name + '] loaded');
		}
		callback(null);
	} catch (error) {
		callback(error);
	}
}

// uncaught exception handler
process.on('uncaughtException', function (error) {
	log.fatal(error);
	process.exit(1);
});

// signal event listener
process.on('SIGINT', function () {
	log.verbose('GraceNote stopped');
	process.exit(0);
});

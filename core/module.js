'use strict';

var async = require('async');
var fs = require('fs');
var modDriver = require('./driver');
var moduleMap = {};
var modulePrefix = 'gracenode-';

module.exports = Module;

function Module(gn, rootPath) {
	this._gn = gn;
	this._use = [];
	this._modPaths = [
		rootPath + 'modules/',
		gn.getRootPath() + 'node_modules/'
	];
}

Module.prototype.addModulePath = function (path) {
	path = this._gn.getRootPath() + path;
	if (this._modPaths.indexOf(path) === -1) {
		return this._modPaths.push(path);
	}
};

Module.prototype.use = function (name, options) {
	
	if (name === 'gracenode') {
		// cannot load itself as a module
		throw new Error('gracenode cannot load gracenode as a module...');
	}	

	if (options && options.driver) {
		modDriver.addDriver(name, options.driver);
	}
	var modName = createModuleName(name);
	if (options && options.name) {
		modName = options.name;
	}

	// check for module name conflict
	if (findNameConflict(this._use, modName)) {
		throw new Error('module name conflict found [' + name + ']: "' + modName + '" \n<options>\n' + JSON.stringify(options || {}, null, 4));
	}	

	this._use.push({ name: name, modName: modName });
};

// deprecated as of Nov/4/2014 version 1.3.3
// TODO: need to add support for more than SQL
Module.prototype.getModuleSchema = function (name, cb) {
	var that = this;
	var path = moduleMap[name];
	if (path) {
		var filePath = path + '/schema.sql';
		that._logger.verbose('looking for', filePath);
		fs.readFile(filePath, 'utf-8', function (error, sql) {
			if (error) {
				return cb(error);
			}
			that._logger.verbose('module schema:\n', sql);
			// remove line breaks and tabs
			sql = sql.replace(/(\n|\t)/g, '');
			// separate sql statements
			var sqlList = sql.split(';');
			// remove an empty entry in the array of sqlList
			var list = [];
			for (var i = 0, len = sqlList.length; i < len; i++) {
				if (sqlList[i] !== '') {
					list.push(sqlList[i]);
				}
			}
			cb(null, list);
		});
		return;
	}
	this._logger.error('sql schema for module [' + name + '] not found');
	cb(null, []);
	
};

Module.prototype.load = function (cb) {
	var that = this;
	// set up module driver manager
	modDriver.setup(this._gn);
	that._gn._profiler.mark('module drivers set up');
	// start loading
	this._logger = this._gn.log.create('module');
	this._logger.verbose('start loading modules');
	// map all modules first
	this._mapModules(function (error) {
		if (error) {
			return cb(error);
		}
		that._gn._profiler.mark('modules mapped');
		// now start loading modules
		async.eachSeries(that._use, function (modObj, next) {
			var name = modObj.name;
			var modName = modObj.modName;
			// load one module at a time
			var module = that._require(name);
			if (!module) {
				return cb(new Error('module [' + name + '] not found'));
			}
			that._prepareModule(name, modName, module, next, cb);
		}, cb);
	});
};

Module.prototype._mapModules = function (cb) {
	var that = this;
	async.each(this._modPaths, function (path, next) {
		fs.readdir(path, function (error, list) {
			if (error) {
				return cb(error);
			}
			for (var i = 0, len = list.length; i < len; i++) {
				var modName = list[i];
				that._logger.verbose('module mapped [' + path + ']:', modName);
				var modulePath = path + modName;
				if (moduleMap[modName]) {
					var err = 'module name conflict detected for [' + modName + '] in ' + moduleMap[modName] + ' and ' + modulePath;
					return cb(new Error(err));
				}
				// no name conflicts
				moduleMap[modName] = modulePath;
			}
			next();
		});
	}, cb);
};

Module.prototype._require = function (name) {
	var path = moduleMap[name];
	if (path) {
		var mod = require(path);
		this._logger.verbose('module [' + name + '] found in', path);
		return mod;
	}
	return null;
};

Module.prototype._prepareModule = function (name, modName, module, next, cb) {
	var that = this;
	this._gn[modName] = module;
	// apply driver if available
	var applied = modDriver.applyDriver(name, module);
	if (applied instanceof Error) {
		return cb(applied, module);
	}
	// handle config
	var err = that._readConfig(name, module, next);
	if (err) {
		return cb(err);
	}
	// handle setup
	this._setup(name, module, function (err) {
		if (err) {
			return next(err);
		}
		var msg = 'module [' + name + '] loaded';
		if (modName !== name) {
			msg += ' as ' + modName;
		}

		// if driver is present and the driver has expose()
		if (module.expose) {
			var exposedMod = module.expose();
			if (!exposedMod) {
				return cb(new Error('module [' + modName + '] driver.expose must return exposed module object'));
			}
			that._gn[modName] = exposedMod;
		}

		that._logger.info(msg);
		that._gn._profiler.mark(msg);
		that._gn.emit('setup.' + name);
		next();
	});
};

Module.prototype._readConfig = function (name, mod) {
	if (typeof mod.readConfig === 'function') {
		this._logger.verbose('module [' + name + '] reading configurations from modules.' + name);
		var conf = this._gn.config.getOne('modules.' + name);
		if (!conf) {
			return new Error('failed to find configurations for module [' + name + ']\n' + JSON.stringify(this._gn.config.getConfigFiles(), null, 4));
		}
		var status = mod.readConfig(this._gn.config.getOne('modules.' + name));
		if (status instanceof Error) {
			return status;
		}
	}
	// no error
	return null;
};

Module.prototype._setup = function (name, module, cb) {
	if (typeof module.setup === 'function') {
		this._logger.verbose('executing setup of module [' + name + ']');
		return module.setup(cb);
	}
	// no setup function for this module
	cb();
};

function findNameConflict(modList, name) {
	var found = modList.filter(function (mod) {
		var modName = mod.modName ? mod.modName : mod.name;
		if (modName === name) {
			return modName;
		}
	});
	if (found.length) {
		// name conflict found
		return true;	
	}
	return false;
}

// -ed names will be camel-cased
function createModuleName(name) {
	// remove gracenode prefix
	name = name.replace(modulePrefix, '');
	var sep = name.split('-');
	var camelCased = sep[0];
	for (var i = 1, len = sep.length; i < len; i++) {
		var firstChar = sep[i].substring(0, 1).toUpperCase();
		camelCased += firstChar + sep[i].substring(1);
	}
	return camelCased;
}

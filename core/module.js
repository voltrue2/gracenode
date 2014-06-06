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

	this._use.push({ name: name, modName: modName });
};

Module.prototype.getModuleSchema = function (name, cb) {
	var that = this;
	async.eachSeries(this._modPaths, function (path, next) {
		var filePath = path + name + '/schema.sql';
		that._logger.verbose('looking for', filePath);
		fs.readFile(filePath, 'utf-8', function (error, sql) {
			if (error) {
				// not found. try next path
				return next();
			}
			that._logger.verbose('module schema:', sql);
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
	}, function () {
		that._logger.verbose('sql schema for module [' + name + '] not found');
		cb(null, []);
	});
};

Module.prototype.load = function (cb) {
	// set up module driver manager
	modDriver.setup(this._gn);
	// start loading
	this._logger = this._gn.log.create('module');
	this._logger.verbose('start loading modules');
	var that = this;
	// map all modules first
	this._mapModules(function (error) {
		if (error) {
			return cb(error);
		}
		// now start loading modules
		async.eachSeries(that._use, function (modObj, next) {
			var name = modObj.name;
			var modName = modObj.modName;
			// load one module at a time
			that._loadOne(name, function (error, module) {
				if (error) {
					return next(error);
				}
				that._prepareModule(name, modName, module, next, cb);
			});
		}, cb);
	});
};

Module.prototype._mapModules = function (cb) {
	var that = this;
	// remember the module names to detect module name conflict(s) in different module paths
	var seen = {};
	async.each(this._modPaths, function (path, next) {
		fs.readdir(path, function (error, list) {
			if (error) {
				return cb(error);
			}
			for (var i = 0, len = list.length; i < len; i++) {
				var modName = list[i];
				that._logger.verbose('module mapped [' + path + ']:', modName);
				var modulePath = path + modName;
				if (seen[modName]) {
					// there is at least more than one module with the same name
					seen[modName].push(modulePath);
					that._logger.fatal('conflicted modules:', seen[modName]);
					return cb(new Error('module name coflict detected: module name [' + modName + ']'));
				}
				// no name conflicts
				seen[modName] = [modulePath];
				moduleMap[modulePath] = modName;
			}
			next();
		});
	}, cb);
};

Module.prototype._loadOne = function (name, cb) {
	var that = this;
	async.eachSeries(this._modPaths, function (dir, next) {
		var path = dir + name;
		that._logger.verbose('looking for module [' + name + '] in', path);
		var mod = that._require(name, path);
		if (mod) {
			var applied = modDriver.applyDriver(name, mod);
			if (applied instanceof Error) {
				return cb(applied, mod);
			}
			return cb(null, mod);
		}
		next();
	},
	function () {
		// we could not find the module...
		cb(new Error('module [' + name + '] not found'));
	});
};

Module.prototype._require = function (name, path) {
	var found = moduleMap[path];
	if (found) {
		var mod = require(path);
		this._logger.verbose('module [' + name + '] found in', path);
		return mod;
	}
	return null;
};

Module.prototype._prepareModule = function (name, modName, module, next, cb) {
	var that = this;
	this._gn[modName] = module;
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

		that._logger.verbose(msg);
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
			return new Error('failed to find configurations for module [' + name + ']');
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

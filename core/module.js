var async = require('async');
var fs = require('fs');
var modDriver = require('./driver');

var modulePrefix = 'gracenode-';

module.exports = Module;

function Module(gn, rootPath) {
	this._gn = gn;
	this._builtInPath = rootPath + 'modules/';
	this._appNodeModulePath = gn.getRootPath() + 'node_modules/';
	this._use = [];
	this._overrides = [];
	this._modPaths = [];
}

Module.prototype.addModulePath = function (path) {
	path = this._gn.getRootPath() + path;
	if (this._modPaths.indexOf(path) === -1) {
		return this._modPaths.push(path);
	}
};

Module.prototype.use = function (name, options) {
	if (options && options.driver) {
		modDriver.addDriver(name, options.driver);
	}
	var altName = null;
	if (options && options.name) {
		altName = options.name;
	}
	this._use.push({ name: name, altName: altName });
};

Module.prototype.override = function (name, options) {
	if (this._overrides.indexOf(name) === -1) {
		this._overrides.push(name);
		return this.use(name, options);
	}
};

Module.prototype.getModuleSchema = function (name, cb) {
	var that = this;
	var paths = [this._builtInPath, this._appNodeModulePath];
	paths = paths.concat(this._modPaths);
	async.eachSeries(paths, function (path, next) {
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
	// look for module name conflicts
	var seen = [];
	for (var i = 0, len = this._use.length; i < len; i++) {
		var mod = this._use[i];
		var name = mod.altName || mod.name;
		if (seen.indexOf(name) === -1) {
			seen.push(name);
		} else {
			this._logger.error(mod);
			return cb('module name coflict detected');
		}
	}
	// set up module driver manager
	modDriver.setup(this._gn);
	// start loading
	this._logger = this._gn.log.create('module');
	this._logger.verbose('start loading modules');
	var that = this;
	async.eachSeries(this._use, function (modObj, next) {
		var name = modObj.name;
		var altName = modObj.altName;
		// load one module at a time
		that._loadOne(name, function (error, module) {
			if (error) {
				return next(error);
			}
			// append loaded module to gracenode
			var modName = altName || name;
			modName = createModuleName(modName);
			that._gn[modName] = module;
			// handle config
			var err = that._readConfig(name, module, next);
			if (err) {
				return cb(error);
			}
			// handle setup
			that._setup(name, module, function (err) {
				if (err) {
					return next(err);
				}
				var msg = 'module [' + name + '] loaded';
				if (modName !== name) {
					msg += ' as ' + modName;
				}
				that._logger.verbose(msg);
				that._gn._profiler.mark(msg);
				that._gn.emit('setup.' + name);
				next();
			});
		});
	}, cb);
};

Module.prototype._loadOne = function (name, cb) {
	// this variable will remember the found built-in module path for override case
	var builtInPath;
	try {
		// try gracenode module first
		var that = this;
		var path = this._builtInPath + name;
		this._logger.verbose('looking for module [' + name + '] in', path);
		fs.exists(path, function (exists) {
			if (exists) {
				// try to require the module
				var mod = that._require(name, path, null);
				if (mod) {
					// we have required the module, done
					return cb(null, mod);
				}
				// we have NOT required the module
				builtInPath = path;
			}
			// try other path(s)
			that._loadExternal(name, builtInPath, function (found) {
				// check if we found the module or not
				if (!found) {
					return cb(new Error('failed to find module [' + name + ']'));	
				}
				cb(null, found);
			});
		});
	} catch (e) {
		cb(e);
	}
};

Module.prototype._loadExternal = function (name, builtInPath, cb) {
	var that = this;
	async.eachSeries(this._modPaths, function (dir, next) {
		var path = dir + name;
		that._logger.verbose('looking for module [' + name + '] in', path);
		fs.exists(path, function (exists) {
			if (exists) {
				var mod = that._require(name, path, builtInPath);
				if (mod) {
					// we have required it, done
					return cb(mod);
				}		
			}
			next();
		}); 
	}, function () {
		// we found no module... in module paths
		// now try node_modules of the application
		that._loadFromNodeModules(name, builtInPath, function (error, module) {
			if (error) {
				return cb(error);
			}
			cb(module);
		});
	});
};

Module.prototype._loadFromNodeModules = function (name, builtInPath, cb) {
	var that = this;
	this._logger.verbose('looking for module [' + name + '] in ', this._appNodeModulePath);
	fs.exists(this._appNodeModulePath + name, function (exists) {
		if (!exists) {
			return cb();
		}
		var mod = that._require(name, that._appNodeModulePath + name, builtInPath);
		// check to see if there is a driver for this module
		var applied = modDriver.applyDriver(name, mod);
		if (applied instanceof Error) {
			// there was an error while applying the driver to the module
			return cb(applied, mod);
		}
		cb(null, mod);
	});
};

Module.prototype._require = function (name, path, builtInPath) {
	this._logger.verbose('module [' + name + '] found in', path);
	// check if this module is to be overridden
	if (this._overrides.indexOf(name) !== -1) {
		if (builtInPath && builtInPath !== path) {
			// we found the module that will override the built-in module
			this._logger.verbose('module [' + name + '] found and overridden with', path);
			return require(path);
		}
		// is to be overridden
		this._logger.verbose('module [' + name + '] will be overridden by a custom module of the same name');
		return null;
	}
	// is NOT to be overridden
	return require(path);
};

Module.prototype._readConfig = function (name, mod) {
	if (typeof mod.readConfig === 'function') {
		this._logger.verbose('module [' + name + '] reading configurations from modules.' + name);
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

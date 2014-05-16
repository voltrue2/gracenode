var async = require('async');
var fs = require('fs');

module.exports = Module;

function Module(gn, rootPath) {
	this._gn = gn;
	this._builtInPath = gn.getRootPath() + rootPath + '/modules/';
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

Module.prototype.use = function (name) {
	if (this._use.indexOf(name) === -1) {
		return this._use.push(name);
	}
};

Module.prototype.override = function (name) {
	if (this._overrides.indexOf(name) === -1) {
		this._overrides.push(name);
		return this.use(name);
	}
};

Module.prototype.getModuleSchema = function (name, cb) {
	var that = this;
	var paths = [this._builtInPath];
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
	this._logger = this._gn.log.create('module');
	this._logger.verbose('start loading modules');
	var that = this;
	async.eachSeries(this._use, function (name, next) {
		// load one module at a time
		that._load(name, function (error, module) {
			if (error) {
				return next(error);
			}
			// append loaded module to gracenode
			that._gn[name] = module;
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
				that._logger.verbose(msg);
				that._gn._profiler.mark(msg);
				that._gn.emit('setup.' + name);
				next();
			});
		});
	}, cb);
};

Module.prototype._load = function (name, cb) {
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
		// we found no module...
		cb();
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
		this._logger.verbose('module [' + name + '] reading configurations');
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

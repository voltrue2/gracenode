
/**
 * configurations
 *
 * {
 *		"staticdata": {
 *			"path": "directory path to the source static files",
 *			"linebreak": optional,
 *			"delimiter": optional,
 *			"qoute": optional,
 *			"index": optional {
 *				"staticFileName": ["indexName"...] > this must be a cloumn name in the file
 *			}
 *		}
 * }
 *
 * */

var fs = require('fs');
var async = require('async');

var gracenode = require('../../');
var log = gracenode.log.create('staticdata');

var config;
var linebreak = '\n';
var delimiter = ',';
var quote = '"';
var staticData = {};

module.exports.readConfig = function (configIn) {
	if (!configIn || !configIn.path) {
		return new Error('invalid configuration: \n' + JSON.stringify(configIn, null, 4));
	}
	config = configIn;
	// optional
	if (config.linebreak !== undefined) {
		linebreak = config.linebreak;
	}
	if (config.delimiter !== undefined) {
		delimiter = config.delimiter;
	}
	if (config.quote !== undefined) {
		quote = config.quote;
	}
};

module.exports.setup = function (cb) {
	log.verbose('setting up static data module...');
	gracenode.lib.walkDir(gracenode.getRootPath() + config.path, function (error, list) {
		if (error) {
			return cb(error);
		}
		async.forEach(list, function (item, nextCallback) {
			readFile(item.file, nextCallback);
		}, cb);
	});
};

module.exports.getOne = function (dataName) {
	if (staticData[dataName]) {
		return new StaticData(dataName, staticData[dataName]);
	}
	return null;
};

module.exports.getMany = function (dataNameList) {
	var res = {};
	for (var i = 0, len = dataNameList.length; i < len; i++) {
		var dataName = dataNameList[i];
		var data = this.getOne(dataName);
		res[dataName] = data;
	}
	return res;
};

function readFile(path, cb) {
	var lastDot = path.lastIndexOf('.');
	var type = path.substring(lastDot + 1);
	var name = path.substring(path.lastIndexOf('/') + 1, lastDot);
	fs.lstat(path, function (error, stat) {
		if (error) {
			return cb(error);
		}
		fs.readFile(path, function (error, dataBuffer) {
			if (error) {
				return cb(error);
			}
			var data = dataBuffer.toString('utf-8');

			var bytes = dataBuffer.length;
			var kb = bytes / 1024;
			var size = bytes + ' bytes';
			if (kb >= 1) {
				size = kb + 'kb';
			}
			log.verbose('static data loaded:', path + ' (' + size + ')');

			// convert to JSON		
			if (type === 'csv') {
				data = toJSON(data);
			}
			// check for error
			if (data instanceof Error) {
				return cb(data);
			}
			
			// create index map(s) if asked
			var indexMap = null;
			var fileName = name + '.' + type;
			if (config.index && config.index[fileName]) {
				indexMap = mapIndex(data, config.index[fileName]);
			}	
			// add it to cache
			var d = new Date(stat.mtime);
			var mtime = d.getTime();
			staticData[name] = { data: data, indexMap: indexMap, path: path, mtime: mtime };

			cb();
		});
	});
}

function toJSON(data) {
	// assume first row as the list of columns
	var res = [];
	var pattern = new RegExp(quote, 'g');
	var rows = data.replace(pattern, '').split(linebreak);
	var columns = rows[0].split(delimiter);
	var columnLen = columns.length;
	for (var i = 1, len = rows.length; i < len; i++) {
		if (!rows[i]) {
			// ignore empty
			continue;
		}
		var item = {};
		var cols = rows[i].split(delimiter);
		// validate data schema
		if (cols.length !== columnLen) {
			return new Error('data is corrupt: \ncolumns: \n' + JSON.stringify(columns, null, 4) + '\ndata: \n' + JSON.stringify(cols, null, 4));
		}
		for (var j = 0; j < columnLen; j++) {
			item[columns[j]] = cols[j];
		}
		res.push(item);
	}
	return res;
}

function mapIndex(data, indexNames) {
	var map = {};
	for (var c = 0, length = data.length; c < length; c++) {
		var item = data[c];
		for (var i = 0, len = indexNames.length; i < len; i++) {
			var index = indexNames[i];
			if (item[index] !== undefined) {
				if (!map[index]) {
					map[index] = {};
				}
				map[index][item[index]] = {};
				for (var key in item) {
					if (key !== index) {
						map[index][item[index]][key] = item[key];
					}
				}
			}
		}
	}
	return map;
}

function validateCachedData(name, cb) {
	if (staticData[name]) {
		var data = staticData[name];
		return fs.lstat(data.path, function (error, stat) {
			if (error) {
				return cb(error);
			}
			var d = new Date(stat.mtime);
			var mtime = d.getTime();
			if (mtime !== data.mtime) {
				// file has been modified > update cache
				return readFile(data.path, function (error) {
					if (error) {
						return cb(error);
					}
					// pass the updated cached data
					cb(null, staticData[name]);
				});
			}
			// cached data is still the latest
			cb();
		});
	}
	cb(new Error('cached data not found'));
}

function StaticData(name, src) {
	this._name = name;
	this._src = src.data;
	this._indexMap = src.indexMap;
}

StaticData.prototype.getOneByIndex = function (indexName, key, cb) {
	var that = this;
	this.validateCachedData(function (error) {
		if (error) {
			return cb(error);
		}
		if (that._indexMap[indexName]) {
			if (that._indexMap[indexName][key] !== undefined) {
				if (typeof that._indexMap[indexName][key] === 'object') {
					return cb(null, getObjValue(that._indexMap[indexName][key]));
				}
				return cb(null, that._indexMap[indexName][key]);
			}
		}
		cb(null, null);
	});
};

StaticData.prototype.getManyByIndex = function (indexName, keyList, cb) {
	var res = {};
	var that = this;
	async.forEach(keyList, function (key, nextCallback) {
		that.getOneByIndex(indexName, key, function (error, data) {
			if (error) {
				return cb(error);
			}
			res[key] = data;
			nextCallback();
		});
	}, 
	function (error) {
		cb(error, res);
	});
};

StaticData.prototype.getOne = function (index, cb) {
	var that = this;
	this.validateCachedData(function (error) {
		if (error) {
			return cb(error);
		}
		if (that._src[index]) {	
			if (typeof that._src[index] === 'object') {
				return cb(null, getObjValue(that._src[index]));
			}
			return cb(null, that._src[index]);
		}
		cb(null, null);
	});
};

StaticData.prototype.getMany = function (indexList) {
	var res = {};
	var that = this;
	async.forEach(indexList, function (index, nextCallback) {
		that.getOne(index, function (error, data) {
			if (error) {
				return cb(error);
			}
			res[index] = data;
			nextCallback();
		});
	},
	function (error) {
		cb(error, res);
	});
};

StaticData.prototype.getAll = function (cb) {
	var that = this;
	this.validateCachedData(function (error) {
		if (error) {
			return cb(error);
		}
		cb(null, getObjValue(that._src));
	});
};

StaticData.prototype.validateCachedData = function (cb) {
	var that = this;
	validateCachedData(this._name, function (error, updatedData) {
		if (error) {
			return cb(error);
		}
		if (updatedData) {
			that.update(updatedData);
		}
		cb();
	});
};

StaticData.prototype.update = function (src) {
	log.verbose('static data [' + this._name + '] has been updated');
	this._src = src.data;
	this._indexMap = src.indexMap;
};

function getObjValue(data) {
	var obj;
	if (Array.isArray(data)) {
		obj = [];
		for (var i = 0, len = data.length; i < len; i++) {
			obj.push(data[i]);
		}
	} else {
		obj = {};
		for (var key in data) {
			obj[key] = data[key];
		}
	}
	return obj;
}

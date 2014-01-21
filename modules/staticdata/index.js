
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
		async.eachSeries(list, function (item, nextCallback) {
			readFile(item.file, nextCallback);
		}, cb);
	});
};

/*
* dataName rule:
* configuration path: staticdata/
* example: staticdata/example/test.csv = example/test
*/
module.exports.create = function (dataName) {
	if (staticData[dataName]) {
		return new StaticData(dataName, staticData[dataName]);
	}
	return null;
};

function readFile(path, cb) {
	var lastDot = path.lastIndexOf('.');
	var type = path.substring(lastDot + 1);
	var name = path.substring(path.lastIndexOf(config.path) + config.path.length, lastDot);
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
				size = Math.round(kb) + ' kb';
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
				
				log.verbose('indexed: ', config.index[fileName]);
			}	
			
			// add it to cache
			var d = new Date(stat.mtime);
			var mtime = d.getTime();
			staticData[name] = { data: data, indexMap: indexMap, path: path, mtime: mtime };

			log.verbose('mapped: ' + path + ' > ' + name);

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
			var value = getValue(cols[j]);
			item[columns[j]] = value;
		}
		res.push(item);
	}
	return res;
}

function getValue(value) {
	if (!isNaN(value)) {
		return Number(value);
	}
	switch (value.toLowerCase()) {
		case 'true':
			return true;
		case 'false':
			return false;
		case 'null':
			return null;
		case 'undefined':
			return undefined;
		default:
			return value;
	}
}

function mapIndex(data, indexNames) {
	var map = {};
	for (var c = 0, length = data.length; c < length; c++) {
		var item = data[c];
		for (var i = 0, len = indexNames.length; i < len; i++) {
			var indexName = indexNames[i];
			if (item[indexName] !== undefined) {
				if (!map[indexName]) {
					map[indexName] = {};
				}
				var index = item[indexName];
				var itemObj = {};
				for (var key in item) {
					itemObj[key] = item[key];
				}
				if (map[indexName][index]) {
					// index is not unique
					if (!Array.isArray(map[indexName][index])) {
						map[indexName][index] = [map[indexName][index]];
					}
					map[indexName][index].push(itemObj);
				} else {
					// index is unique or this is the first item of the index
					map[indexName][index] = itemObj;
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
		if (that._indexMap && that._indexMap[indexName]) {
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
	async.eachSeries(keyList, function (key, nextCallback) {
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

StaticData.prototype.getMany = function (indexList, cb) {
	var res = {};
	var that = this;
	async.eachSeries(indexList, function (index, nextCallback) {
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

StaticData.prototype.getAllByIndexName = function (indexName, cb) {
	var that = this;
	this.validateCachedData(function (error) {
		if (error) {
			return cb(error);
		}
		if (that._indexMap[indexName]) {
			return cb(null, getObjValue(that._indexMap[indexName]));
		}
		cb(null, null);
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

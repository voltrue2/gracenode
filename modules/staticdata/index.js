
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
var EventEmitter = require('events').EventEmitter;
var fileWatcher = new EventEmitter();

var gracenode = require('../../');
var log = gracenode.log.create('staticdata');

var config;
var linebreak = '\n';
var delimiter = ',';
var quote = '"';
var staticData = {}; // static data source object
var sdMap = {}; // static data object map

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
	
	// check for existing static data object first
	if (sdMap[dataName]) {
		return sdMap[dataName];
	}	

	// create a new static data object
	if (staticData[dataName]) {
		var sd = new StaticData(dataName, staticData[dataName]);
		sdMap[dataName] = sd;
		return sd;
	}
	return null;
};

function readFile(path, cb) {
	var lastDot = path.lastIndexOf('.');
	var type = path.substring(lastDot + 1);
	var name = path.substring(path.lastIndexOf(config.path) + config.path.length, lastDot);
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
		} else { 
			try {
				data = JSON.parse(data);
			} catch (e) {
				log.error('Could not turn', name, 'into object.');
				return cb(e);
			}
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
		staticData[name] = { data: data, indexMap: indexMap, path: path };
		
		log.verbose('mapped: ' + path + ' > ' + name);

		// set up file watch listener
		setupChangeListener(path);

		cb();
	});
}

function setupChangeListener(path) {
	
	log.verbose('file change listener setup:', path);

	fs.watch(path, function (event) {
		if (event === 'change') {
			readFile(path, function (error) {
				if (error) {
					return log.error(error);
				}
				
				log.info('file updated [' +  event + ']:', path);
			
				fileWatcher.emit(path);
			});
		}
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

function StaticData(name, src) {
	this._name = name;
	this._src = src.data;
	this._indexMap = src.indexMap;

	// file change listener
	var that = this;
	fileWatcher.on(src.path, function () {
		that.update(staticData[name]);
	});
}

StaticData.prototype.getOneByIndex = function (indexName, key) {
	if (!this._indexMap) {
		return null;
	}
	var data = this._indexMap[indexName] || null;
	if (!data || data[key] === undefined) {
		return null;
	}

	var res = data[key];

	if (typeof res === 'object') {
		return getObjValue(res);
	}

	return res;
};

StaticData.prototype.getManyByIndex = function (indexName, keyList) {
	var res = {};
	for (var i = 0, len = keyList.length; i < len; i++) {
		var key = keyList[i];
		res[key] = this.getOneByIndex(indexName, key);
	}	
	return res;
};

StaticData.prototype.getOne = function (index) {
	var data = this._src[index];
	if (data === undefined) {
		return null;
	}

	if (typeof data === 'object') {
		return getObjValue(data);		
	}
	
	return data;
};

StaticData.prototype.getMany = function (indexList) {
	var res = {};
	for (var i = 0, len = indexList.length; i < len; i++) {
		var key = indexList[i];
		res[key] = this.getOne(key);
	}

	return res;
};

StaticData.prototype.getAll = function () {
	return getObjValue(this._src);
};

StaticData.prototype.getAllByIndexName = function (indexName) {
	if (this._indexMap[indexName] === undefined) {
		return null;
	}

	return getObjValue(this._indexMap[indexName]);
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

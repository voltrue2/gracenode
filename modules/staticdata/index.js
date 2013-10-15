
/**
 * configurations
 *
 * {
 *		"staticdata": {
 *			"path": "directory path to the source statif files",
 *			"linebreak": optional,
 *			"delimiter": optional,
 *			"qoute": optional
 *		}
 * }
 *
 * */

var fs = require('fs');
var async = require('async');

var gracenode = require('../../gracenode');
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
	fs.readdir(config.path, function (error, list) {
		if (error) {
			return cb(error);
		}
		
		log.verbose('load static data: ', config);
		
		async.forEach(list, function (file, nextCallback) {
				readFile(file, nextCallback);
		}, cb);
	});
};

module.exports.getOne = function (dataName) {
	if (staticData[dataName]) {
		return new StaticData(staticData[dataName]);
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

function readFile(file, cb) {
	var path = config.path + file;
	var lastDot = file.lastIndexOf('.');
	var type = file.substring(lastDot + 1);
	var name = file.substring(file.lastIndexOf('/') + 1, lastDot);
	fs.readFile(path, function (error, dataBuffer) {
		if (error) {
			return cb(error);
		}
		var data = dataBuffer.toString('utf-8');

		var bytes = dataBuffer.length;
		log.verbose('static data loaded:', path + ' (' + bytes + ' bytes, ' + (bytes / 1024) + ' kb)');
		
		if (type === 'csv') {
			data = toJSON(data);
		}
		// check for error
		if (data instanceof Error) {
			return cb(data);
		}
		staticData[name] = data;

		cb();
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

function StaticData(src) {
	this._src = src;
}

StaticData.prototype.getOne = function (index) {
	if (this._src[index]) {
		return this._src[index];
	}
	return null;
};

StaticData.prototype.getMany = function (indexList) {
	var res = {};
	for (var i = 0, len = indexList.length; i < len; i++) {
		var index = indexList[i];
		var data = this.getOne(index);
		res[index] = data;
	}
	return res;
};

StaticData.prototype.getAll = function () {
	// javascript gives you a pointer to the object not a copy, so to avoid poisning the source object, we create a copy by hand
	var res = [];
	for (var index in this._src) {
		var data = this._src[index];
		var item = {};
		for (var key in data) {
			item[key] = data[key];
		}
		res[index] = item;
	}
	return res;
};

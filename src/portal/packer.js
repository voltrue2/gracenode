'use strict';

const gn = require('../gracenode');

const DATA_TYPE_BUFFER = 254;
const DATA_TYPE_ERR = 253;

module.exports.pack = function (data) {
	if (!data) {
		return gn.Buffer.alloc(0);
	}
	if (Buffer.isBuffer(data)) {
		return data;
	}
	// JSON is much faster than Buffer...
	return gn.Buffer.alloc(JSON.stringify(convert(data)), 'utf8');
};

module.exports.unpack = function (buf) {
	if (!Buffer.isBuffer(buf) || buf.length === 0) {
		if (typeof buf === 'object') {
			return revert(buf);
		}
		return null;
	}
	// JSON is much faster than Buffer...
	try {
		var data = JSON.parse(buf);
		return revert(data);
	} catch (error) {
		return buf;
	}
};

function convert(data) {
	if (Buffer.isBuffer(data)) {
		return { _dt: DATA_TYPE_BUFFER, _d: data.toString('base64') };
	} else if (data instanceof Error) {
		return { _dt: DATA_TYPE_ERR, _d: data.message };
	}
	if (data === null && data === undefined) {
		return data;
	}
	var res;
	var type = typeof data;
	if (type === 'object' && Array.isArray(data)) {
		res = [];
		for (var i = 0, len = data.length; i < len; i++) {
			res[i] = convert(data[i]);
		}
	} else if (type === 'object' && data !== null) {
		var keys = Object.keys(data);
		res = {};
		for (var j = 0, jen = keys.length; j < jen; j++) {
			var key = keys[j];
			res[key] = convert(data[key]);
		}
	} else {
		res = data;
	}
	return res;
}

function revert(data) {
	if (data === null || data === undefined) {
		return data;
	}
	var type = typeof data;
	if (type === 'object' && data._dt === DATA_TYPE_BUFFER) {
		return gn.Buffer.alloc(data._d, 'base64');
	} else if (type === 'object' && data._dt === DATA_TYPE_ERR) {
		return new Error(data._d);
	} else if (type === 'object' && Array.isArray(data)) {
		for (var i = 0, len = data.length; i < len; i++) {
			data[i] = revert(data[i]);
		}
	} else if (type === 'object') {
		var keys = Object.keys(data);
		for (var j = 0, jen = keys.length; j < jen; j++) {
			var key = keys[j];
			data[key] = revert(data[key]);
		}
	}
	return data;
}


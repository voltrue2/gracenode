'use strict';

const gn = require('gracenode');

const DATA_TYPE_BUFFER = 254;
const DATA_TYPE_ERR = 253;

module.exports.pack = function (data) {
	if (!data) {
		return gn.Buffer.alloc(0);
	}
	// JSON is much faster than Buffer...
	return gn.Buffer.alloc(JSON.stringify(convert(data)), 'utf8');
};

module.exports.unpack = function (buf) {
	if (!Buffer.isBuffer(buf) || buf.length === 0) {
		return null;
	}
	// JSON is much faster than Buffer...
	var data = JSON.parse(buf);
	data = revert(data);
	return data;
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
	var type = typeof data;
	if (type === 'object' && Array.isArray(data)) {
		for (var i = 0, len = data.length; i < len; i++) {
			data[i] = convert(data[i]);
		}
	} else if (type === 'object') {
		for (var key in data) {
			data[key] = convert(data[key]);
		}
	}
	return data;
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
		for (var key in data) {
			data[key] = revert(data[key]);
		}
	}
	return data;
}


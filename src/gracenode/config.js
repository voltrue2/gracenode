'use strict';

const gn = require('../gracenode/');
var config = {};

exports.load = function __configLoad(configObj) {
	for (var i in configObj) {
		if (!config.hasOwnProperty(i)) {
			config[i] = configObj[i];
		} else {
			config[i] = merge(i, config, configObj);
		}
	}
};

// internal use only: for env
exports.dump = function () {
	return JSON.stringify(config);
};
// internal use only: for env
exports.restore = function (stringified) {
	config = JSON.parse(stringified);
};

// dotted notation is supported
exports.get = function __configGet(propName) {
	if (!propName) {
		return gn.lib.cloneObj(config);
	}
	var propNames = [];
	if (propName.indexOf('.') !== -1) {
		// split it by period
		propNames = propName.split('.');
	} else {
		propNames.push(propName);
	}
	// this is to indicate if we found a match of configurations at least once or not
	// if found is false, we return null
	var found = false;
	var conf = gn.lib.cloneObj(config);
	for (var i = 0, len = propNames.length; i < len; i++) {
		var prop = propNames[i];
		if (conf[prop] !== undefined) {
			conf = conf[prop];
			found = true;
		} else {
			// if the configurations you are looking for is not found, return null
			conf = null;
			break;
		}
	}
	if (!found) {
		conf = null;
	}
	return conf;
};

function merge(key, origin, obj) {
	if (typeof origin[key] === 'object' && typeof obj[key] === 'object') {
		if (Array.isArray(origin[key]) && Array.isArray(obj[key])) {
			origin[key] = origin[key].concat(obj[key]);
		} else {
			for (var i in obj[key]) {
				origin[key][i] = merge(i, origin[key], obj[key]);
			}
		}
	} else {
		origin[key] = obj[key]; 
	}
	return origin[key];
}

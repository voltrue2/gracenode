'use strict';

var gn = require('../gracenode/');
var config = {};

exports.load = function (configObj) {
	for (var i in configObj) {
		if (!config.hasOwnProperty(i)) {
			config[i] = configObj[i];
		} else {
			config[i] = merge(i, config, configObj);
		}
	}
};

// dotted notation is supported
exports.get = function (name) {
	if (!name) {
		return gn.lib.cloneObj(config);
	}
	var i = 0;
	var list = name.split('.');
	var tmp = config;
	while (tmp[list[i]]) {
		tmp = tmp[list[i]];
		i += 1;
	}
	return gn.lib.cloneObj(tmp);
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

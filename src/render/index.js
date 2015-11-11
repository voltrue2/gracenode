'use strict';

var loader = require('./loader');

var pathPrefix = '';

exports.config = function (path) {
	pathPrefix = path;
};

exports.setup = function (cb) {
	loader.load(pathPrefix, cb);	
};

exports.render = function (path, vars) {
	var loaded = loader.getLoadedByPath(pathPrefix + path);
	if (!loaded) {
		return null;
	}
	// TODO: apply vars
	for (var i in vars) {
		console.log(i, vars[i]);
	}
};

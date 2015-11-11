'use strict';

var loader = require('./loader');
var render = require('./render');

var pathPrefix = '';

exports.config = function (path) {
	pathPrefix = path;
};

exports.setup = function (cb) {
	loader.load(pathPrefix, cb);	
};

exports.render = function (path, vars) {
	return render.render(path, vars);
};

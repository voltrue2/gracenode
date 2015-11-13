'use strict';

var loader = require('./loader');
var render = require('./render');
var cache = require('./cache');

var pathPrefix = '';

exports.config = function (path) {
	pathPrefix = path;
};

exports.setup = function (cb) {
	if (!pathPrefix) {
		return cb(new Error('RenderMissingPath'));
	}
	loader.load(pathPrefix, cb);	
};

exports.render = function (path, vars, cacheTtl) {
	if (cacheTtl) {
		var res = cache.get(vars);
		if (res) {
			return res;
		}
		var rendered = render.render(path, vars);
		cache.set(vars, rendered, cacheTtl);
		return rendered;
	}
	return render.render(path, vars);
};

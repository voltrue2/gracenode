'use strict';

// default TTL is 60 minutes
var DEFAULT_TTL = 1000 * 60 * 60;

var gn = require('../gracenode');
var loader = require('./loader');
var render = require('./render');
var cache = require('./cache');
var func = require('./func');
var logger;
var pathPrefix = '';

exports.config = function (path, cacheSize) {
	logger = gn.log.create('render');
	pathPrefix = path;
	if (cacheSize !== undefined) {
		cache.setMemSize(cacheSize);
	}
};

exports.setup = function (cb) {
	if (!pathPrefix) {
		return cb(new Error('RenderMissingPath'));
	}
	loader.load(pathPrefix, cb);	
};

exports.render = function (path, vars, cacheTtl) {
	if (cacheTtl === undefined) {
		cacheTtl = DEFAULT_TTL;
	}
	if (cacheTtl) {
		var res = cache.get(vars);
		if (res) {
			logger.verbose('Used render cache:', path);
			return res;
		}
		var rendered = render.render(path, vars);
		cache.set(vars, rendered, cacheTtl);
		logger.verbose('Rendered without cache:', path);
		return rendered;
	}
	return render.render(path, vars);
};

exports.render.getAllPaths = function () {
	return render.getAllPaths();
};

exports.render.func = function (name, handler) {
	func.add(name, handler);
};

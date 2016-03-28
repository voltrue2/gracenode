'use strict';

var fs = require('fs');
var async = require('../../lib/async');
var render = require('./render');
var gn = require('../gracenode');

var logger;
var dirpath;
var loaded = {};
var client = '';

var CLIENT_PATHS = [
	'/../../client/js/html/request.js',
	'/../../client/js/html/render.js'
];

exports.getClient = function () {
	return client;
};

exports.load = function (path, cb) {
	logger = gn.log.create('render.loader');
	dirpath = path;
	load(path, exports.loadClient(cb));
};

exports.loadClient = function (cb) {
	var root = getClientPath();
	return function () {
		async.eachSeries(CLIENT_PATHS, function (path, next) {
			fs.readFile(root + path, 'utf8', function (error, data) {
				if (error) {
					return next(error);
				}
				client += data.replace(/(\n|\r|\t)/g, '');
				next();
			});
		}, cb);
	};
};

exports.getLoadedByPath = function (path) {
	if (loaded[path]) {
		return loaded[path];
	}
	return null;
};

function getClientPath() {
	return __dirname;
}

function load(path, cb) {
	fs.stat(path, function (error, stats) {
		if (error) {
			return cb(error);
		}
		if (stats.isDirectory()) {
			fs.readdir(path, function (error, list) {
				if (error) {
					return cb(error);
				}
				path = path + ((path[path.length - 1] !== '/') ? '/' : '');
				async.each(list, function (file, next) {
					load(path + file, next);
				}, cb);
			});
			return;
		}
		fs.readFile(path, 'utf8', function (error, content) {
			if (error) {
				return cb(error);
			}
			var pathName = path.replace(dirpath, '');
			var prerenderedData = render.prerender(content);
			loaded[pathName] = {
				source: prerenderedData.content,
				tags: prerenderedData.list,
				vars: prerenderedData.vars,
				literals: prerenderedData.literals
			};
			logger.verbose('Pre-rendered:', '[' + pathName + ']', 'from', path);
			cb();
		});
	});
}

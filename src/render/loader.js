'use strict';

var fs = require('fs');
var async = require('async');
var render = require('./render');

var dirpath;
var loaded = {};

exports.load = function (path, cb) {
	dirpath = path;
	load(path, cb);
};

exports.getLoadedByPath = function (path) {
	if (loaded[path]) {
		return loaded[path];
	}
	return null;
};

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
				async.forEachSeries(list, function (file, next) {
					load(path + file, next);
				}, cb);
			});
			return;
		}
		fs.readFile(path, 'utf8', function (error, content) {
			if (error) {
				return cb(error);
			}
			var prerenderedData = render.prerender(content);
			loaded[path.replace(dirpath, '')] = {
				source: prerenderedData.content,
				tags: prerenderedData.list,
				vars: prerenderedData.vars
			};
			cb();
		});
	});
}

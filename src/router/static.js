'use strict';

var fs = require('fs');
var gn = require('../gracenode');

module.exports.findRoutes = function (dirList) {
	var list = [];
	for (var i = 0, len = dirList.length; i < len; i++) {
		list = list.concat(findFiles(dirList[i]));
	}
	return list;
};

module.exports.handle = function (dir) {
	var handler = new Handler(dir);
	var func = function (req, res) {
		handler.handle.apply(handler, [req, res]);
	};
	return func;
};

function findFiles(path) {
	var root = gn.getRootPath();
	var list = [];
	var files = fs.readdirSync(root + path);
	var slash = path[path.length - 1] === '/' ? '' : '/';
	for (var i = 0, len = files.length; i < len; i++) {
		var file = path + slash + files[i];
		var stats = fs.statSync(root + file);
		if (stats.isDirectory()) {
			list = list.concat(findFiles(file));
			continue;	
		}
		// we do not need the file name as it will be the parameter
		var route = path;
		if (route[0] === '/') {
			route = route.substring(1);
		}
		if (route[route.length - 1] !== '/') {
			route += '/';
		}
		var lstIndex = route.lastIndexOf('../');
		if (lstIndex !== -1) {
			route = route.substring(lstIndex + 3);
		}
		if (path[path.length - 1] !== '/') {
			path += '/';
		}
		// avoid same path to be added more than once
		if (list.indexOf(route) !== -1) {
			continue;
		}
		// add the path
		list.push({
			route: route,
			path: path
		});
	}
	return list;
}

function Handler(dir) {
	this._dir = gn.getRootPath() + dir;
}

Handler.prototype.handle = function (req, res) {
	var filename = req.params.filename;
	var path = this._dir + filename;
	res.file(path);
};

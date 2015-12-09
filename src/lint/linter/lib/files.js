'use strict';

var fs = require('fs');
var NODE_MODULES = 'node_modules';

// returns a single-dimension array of all files with full paths in the given directory path
module.exports.walkDir = function (path, cb) {
	var res = [];
	var pending = 0;
	var eachWalk = function (error, results) {
		if (error) {
			return cb(error);
		}
		res = res.concat(results);
		pending--;
		if (!pending) {
			return cb(null, res);
		}
	};

	console.log(path);

	if (path.indexOf(NODE_MODULES) !== -1) {
		// ignore node_modules dir
		return cb(null, []);
	}
	fs.lstat(path, function (error, stat) {
		if (error) {
			return cb(error);
		}
		if (!stat.isDirectory()) {
			res.push({ file: path, stat: stat });
			return cb(null, res);
		}
		fs.readdir(path, function (error, list) {
			if (error) {
				return cb(error);
			}
			pending += list.length;
			if (!pending) {
				return cb(null, res);
			}
			for (var i = 0, len = list.length; i < len; i++) {
				var file = list[i];
				var slash = path.substring(path.length - 1) !== '/' ? '/' : '';
				var filePath = path + slash + file;
				module.exports.walkDir(filePath, eachWalk);
			}
		});
	});
};

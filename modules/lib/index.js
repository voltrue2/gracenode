
var fs = require('fs');
var gracenode = require('../../gracenode');
var log = gracenode.log.create('lib');

module.exports.errorMsg = function () {
	var msg = '';
	for (var i = 0, len = arguments.length; i < len; i++) {
		var arg = arguments[i];
		if (typeof arg === 'object') {
			arg = JSON.stringify(arg, null, 4);
		}
		msg += arg + '\n';
	}
	return msg;
};

module.exports.randomInt = function (min, max) {
	var rand = Math.floor(Math.random() * (max + 1));
	if (rand < min) {
		return min;
	}
	return rand;
};

module.exports.getArguments = function (func) {
	var names = func.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/);
	var args = names[1].replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '');
	args = args.replace(/\s+/g, '').split(',');
	return args.length == 1 && !args[0] ? [] : args;
};

module.exports.walkDir = function (path, cb) {
	var res = [];
	fs.lstat(path, function (error, stat) {
		if (error) {
			return cb(error);
		}
		if (!stat.isDirectory()) {
			log.verbose('file:', path);
			res.push({ file: path, stat: stat });
			return cb(null, res);
		}
		fs.readdir(path, function (error, list) {
			if (error) {
				return cb(error);
			}
			var pending = list.length;
			if (!pending) {
					return cb(null, res);
			}
			list.forEach(function (file) {
				var slash = path.substring(path.length - 1) !== '/' ? '/' : '';
				var filePath = path + slash + file;
				fs.stat(filePath, function (error, stat) {
					if (error) {
						return cb(error);
					}
					if (stat.isDirectory()) {
						return module.exports.walkDir(filePath, function (error, resultList) {
							if (error) {
								return cb(error);
							}
							res = res.concat(resultList);
							pending--;
							if (!pending) {
								cb(null, res);
							}
						});
					}
					log.verbose('file:', filePath);
					res.push({ file: filePath, stat: stat });
					pending--;
					if (!pending) {
						cb(null, res);
					}
				});
			});
		});
	});
};


var gracenode = require('../../');
var log = gracenode.log.create('asset');
var crypto = require('crypto');
var fs = require('fs');
var async = require('async');

var config;
var map = {};

module.exports.readConfig = function (configIn) {
	if (!configIn || !configIn.path) {
		return new Error('invalid configurations given:\n' + JSON.stringify(configIn, null, 4));
	}
	config = configIn;
};

module.exports.setup = function (cb) {
	var path = gracenode.getRootPath() + config.path;
	log.verbose('start mapping asset files: ' + path);
	gracenode.lib.walkDir(path, function (error, list) {
		if (error) {
			return cb(error);
		}
		async.forEachSeries(list, function (item, callback) {
			fs.readFile(item.file, function (error, fileData) {
				if (error) {
					return cb(error);
				}
				var dotIndex = item.file.lastIndexOf('.');
				var type = item.file.substring(dotIndex + 1);
				var key = item.file.replace('.' + type, '').replace(path, '');
				var md5 = crypto.createHash('md5');
				var hash = md5.update(fileData).digest('base64'); 
				var data = {
					path: item.file,
					type: type,
					hash: hash,
					data: fileData			
				};
				map[key] = data;
				log.verbose('mapped asset file:', key);
				callback();
			});
		}, cb);
	});
};

module.exports.getOne = function (key) {
	if (map) {
		return map[key];
	}
	return null;
};

module.exports.getMany = function (keyList) {
	var res = {};
	for (var i = 0, len = keyList.length; i < len; i++) {
		res[keyList[i]] = module.exports.getOne(keyList[i]);
	}
	return res;
};

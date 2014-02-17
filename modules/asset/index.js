
var gracenode = require('../../');
var log = gracenode.log.create('asset');
var crypto = require('crypto');
var fs = require('fs');
var async = require('async');

var config;
// tree map
var map = {}; // stores asset path, hash, ahd type
var dataMap = {}; // stores binary with the same key as map

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
		async.eachSeries(list, function (item, callback) {
			fs.lstat(item.file, function (error, stat) {
				if (error) {
					return cb(error);
				}
				fs.readFile(item.file, function (error, fileData) {
					if (error) {
						return cb(error);
					}
					mapFileData(path, item, fileData, stat);
					callback();
				});
			});
		}, function () {
			log.verbose('asset map:', map);
			cb();
		});
	});
};

// supports "/" separated key > img/example/example.png etc...
module.exports.getOne = function (keySource) {
	var keys = keySource.split('/');
	var res = map;
	var matched = false;
	for (var i = 0, len = keys.length; i < len; i++) {
		var key = keys[i];
		if (res[key]) {
			matched = true;
			res = res[key];
		}
	}
	if (matched) {
		return gracenode.lib.cloneObj(res);
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

module.exports.getDataByKey = function (key) {
	if (dataMap[key]) {
		return dataMap[key];
	}
	return null;
};

// if hash is different read the file again to update
module.exports.getDataByKeyAndHash = function (key, hash, cb) {
	var data = dataMap[key] || null;
	if (!data) {
		return cb(new Error('file not found: ' + key + ', ' + hash), null);
	}
	if (data.hash === hash) {
	
		log.verbose('get asset data: ' + key + ' ' + hash + ' [cache found]');

		return cb(null, data);
	}
	// file is not up-to-date > read the file again
	gracenode.lib.walkDir(data.path, function (error, list) {
		if (error) {
			return cb(error);
		}
		var item = list[0] || null;
		if (!item) {
			return cb(new Error('file not found: ' + data.path), null);
		}
		fs.lstat(item.file, function (error, stat) {
			if (error) {
				return cb(error);
			}
			fs.readFile(item.file, function (error, fileData) {
				if (error) {
					return cb(error);
				}
				// update the map
				mapFileData(data.path, item, fileData, stat);
				// get the new data
		
				log.verbose('get asset data: ' + key + ' ' + hash + ' [read file] > map updated');

				cb(null, module.exports.getDataByKey(key));
			});
		});
	});
};

function mapFileData(path, item, fileData, stat) {
	var data = createMapData(path, item, fileData);
	var keys = data.key.split('/');
	var mapObj = map;
	var len = keys.length - 1;
	for (var i = 0; i <= len; i++) {
		var key = keys[i];
		if (mapObj[key] === undefined) {
			if (i === len) {
				mapObj[key] = data;
			} else {
				mapObj[key] = {};
			}
		}
		mapObj = mapObj[key];
	}
	var dataKey = data.key;
	dataMap[dataKey] = { 
		data: fileData,
		path: item.file,
		hash: data.hash,
		mtime: stat.mtime
	};
	log.verbose('mapped asset file:', data.key);
}

function createMapData(path, item, fileData) {
	var dotIndex = item.file.lastIndexOf('.');
	var type = item.file.substring(dotIndex + 1);
	var keySource = item.file.replace('.' + type, '').replace(path, '');
	var hash = createFileHash(fileData);
	return { type: type, key: keySource, hash: hash };
}

function createFileHash(fileData) {
	var md5 = crypto.createHash('md5');
	return md5.update(fileData).digest('base64'); 
}

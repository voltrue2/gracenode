
var Memcache = require('memcached');
var gracenode = require('../../');
var log = gracenode.log.create('memcache');

var config = null;

/*
* "datacache": {
*	"hosts": ["host", "host"...] or { "host": load balance(int)... },
*	"ttl": int,
*	"options": {}
* }
*/

module.exports.readConfig = function (configIn) {
	if (!configIn.hosts || !configIn.ttl) {
		throw new Error('invalid configuration: \n' + JSON.stringify(configIn, null, 4));		
	}
	config = configIn;
};

module.exports.create = function (name) {
	return new Cache(name);
};

function Cache(name) {
	this._cache = new Memcache(config.hosts, config.options || null);
	this._name = name;
}

Cache.prototype.getOne = function (rawKey, cb) {
	this._cache.get(this._createKey(rawKey), function (error, value) {
		if (error) {
			log.error(error);
		}
		cb(error, value);
	});
};

Cache.prototype.getMany = function (rawKeyList, cb) {
	var keys = [];
	for (var i = 0, len = rawKeyList.length; i < len; i++) {
		keys.push(this._createKey(rawKeyList[i]));
	} 
	this._cache.getMulti(keys, function (error, resMap) {
		if (error) {
			log.error();
		}
		cb(error, resMap);
	});
};

Cache.prototype.set = function (rawKey, value, cb) {
	this._cache.set(this._createKey(rawKey), value, config.ttl, function (error) {
		if (error) {
			log.error(error);
		}
		cb(error);
	});
};

Cache.prototype.replace = function (rawKey, value, cb) {
	this._cache.replace(this._createKey(rawKey), value, config.ttl, function (error) {
		if (error) {
			log.error(error);
		}
		cb(error);
	});
};

Cache.prototype.del = function (rawKey, cb) {
	this._cache.del(this._createKey(rawKey), function (error) {
		if (error) {
			return log.error(error);
		}
		cb(error);
	});
};

Cache.prototype._createKey = function (src) {
	var key = this._name + '/' + src;
	log.verbose('create cache key: ' + src + ' -> ' + key);
	return key;
};

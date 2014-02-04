
var crypto = require('crypto');
var Memcache = require('memcached');
var gracenode = require('../../');
var log = gracenode.log.create('datacache');

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

Cache.prototype.get = function (rawKey, cb) {
	var sDate = new Date();
	var start = sDate.getTime();

	var that = this;
	this._getBaseCache(function (error, timestamp) {
		if (error) {
			return cb(error);
		}
		if (timestamp) {
			// try cache
			var key = that._createKey(rawKey + timestamp + that._name);
			return that._cache.get(key, function (error, value) {
				if (error) {
					return cb(error);
				}
				if (value !== null) {
					log.verbose('cache found [true]: ' + key);
				}

				var eDate = new Date();
				var end = eDate.getTime();
				log.verbose('get cache took [' + (end - start) + ' ms]');
		
				cb(null, value);
			});
		}
		cb();
	});
};

Cache.prototype.set = function (rawKey, value, cb) {
	var that = this;
	var setKey = function (timestamp, callback) {
		var key = that._createKey(rawKey + timestamp + that._name);
		that._cache.set(key, value, config.ttl, function (error) {
			if (error) {
				return cb(error);
			}
			log.verbose('cache set:', rawKey, key);
			callback();
		});
	};

	this._getBaseCache(function (error, timestamp) {
		if (error) {
			return cb(error);
		}
		if (!timestamp) {
			// no timestamp
			return that._createBaseCache(function (error, timestamp) {
				if (error) {
					return cb(error);
				}
				setKey(timestamp, cb);
			});
		}
		// found timestamp
		setKey(timestamp, cb);
	});
};

// call this when you change the data to flush out the old cache
Cache.prototype.update = function (cb) {
	log.verbose('update base cache');
	this._createBaseCache(cb);
};

Cache.flush = function (cb) {
	var key = this._createKey(this._name);
	var that = this;
	this.del(key, function (error) {
		if (error) {
			return cb(error);
		}
		log.verbose('base cache deleted > cache for "' + that._name + '" flushed:', that._name);
		cb();
	});
};

Cache.prototype._getBaseCache = function (cb) {
	var key = this._createKey(this._name);
	var that = this;
	this._cache.get(key, function (error, value) {
		if (error) {
			return cb(error);
		}
		log.verbose('base cache found [' + (value ? true : false) + ']: ' + that._name);
		cb(null, value);
	});
};

Cache.prototype._createBaseCache = function (cb) {
	var key = this._createKey(this._name);
	var that = this;
	var d = new Date();
	var timestamp = d.getTime();
	this._cache.set(key, timestamp, config.ttl, function (error) {
		if (error) {
			return cb(error);
		}
		log.verbose('base cache created:', that._name, timestamp);
		cb(null, timestamp);
	});
};

Cache.prototype._createKey = function (src) {
	var md5 = crypto.createHash('md5');
	var key = md5.update(src).digest('base64');
	log.verbose('create cache key: ' + src + ' -> ' + key);
	return key;
};

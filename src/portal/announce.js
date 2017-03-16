'use strict';

const redis = require('redis');
const async = require('../../lib/async');
const gn = require('../../src/gracenode');
const delivery = require('./delivery');

const PREFIX = '__gic/';
const SCAN_COUNT = 1000;
const PATTERN = PREFIX + '*';
const MATCH = 'MATCH';
const COUNT = 'COUNT';

const conf = {
	// enable: false,
	host: '127.0.0.1',
	port: 6379,
	interval: 1000
};
const valueMap = {};

var cache = {};
var logger;
var info;
var rclient;
var serverType = 'normal';

module.exports.config = function (_conf) {
	if (_conf.enable) {
		conf.enable = _conf.enable;
	}
	if (_conf.host) {
		conf.host = _conf.host;
	}
	if (_conf.port) {
		conf.port = _conf.port;
	}
	if (_conf.interval) {
		conf.interval = _conf.interval;
	}
	logger = gn.log.create('portal.announce');
};

module.exports.setup = function (cb) {
	if (!conf.enable) {
		return cb();
	}
	if (gn.isCluster() && gn.isMaster()) {
		return cb();
	}
	logger.info('connecting to redis @', conf.host + ':' + conf.port);
	rclient = redis.createClient(conf);
	rclient.on('ready', function () {
		logger.info('connected redis @', conf.host + ':' + conf.port);
		info = delivery.info();
		startAnnounceAndRead();
		cb();
	});
	rclient.on('reconnect', function () {
		logger.info('connection to redis has been lost and reconnected @', conf.host + ':' + conf.port);
	});
	rclient.on('error', function (error) {
		logger.error('connection to redis detected an error:', conf.host + ':' + conf.port, error);
		closeConnection();
	});
	gn.onExit(function portalAnnounceShutdown(next) {
		closeConnection();
		next();
	});
};

module.exports.setServerType = function (type) {
	serverType = type;
};

module.exports.setValue = function (key, value) {
	if (value !== null && typeof value === 'object') {
		logger.error('requires value to be a string or a number:', key, value);
		throw new Error('InvalidAnnounceValue');
	}
	valueMap[key] = value;
};

module.exports.getNodes = function (type) {
	if (cache[type]) {
		return cache[type];
	}
	return null;
};

module.exports.getAllNodes = function () {
	var list = [];
	for (const type in cache) {
		list = list.concat(cache[type]);
	}
	return list;
};

function startAnnounceAndRead() {
	const ttl = conf.interval * 10 / 1000;
	const announce = function __portalAnnounce(next) {
		if (!rclient) {
			return done();
		}
		const multi = rclient.multi();
		const key = createKey();
		multi.set(key, createValue());
		multi.expire(key, ttl);
		multi.exec(function __portalOnAnnounce(error) {
			if (error) {
				logger.error('announce failed:', error);
			}
			next();
		});
	};
	const read = function __portalRead(next) {
		if (!rclient) {
			return done();
		}
		scan(function __portalOnRead(error) {
			if (error) {
				logger.error('read failed:', error);
			}
			next();
		});
	};
	const done = function (error) {
		if (error) {
			logger.error(error);
		}
		setTimeout(exec, conf.interval);
	};
	const tasks = [
		announce,
		read
	];
	const exec = function () {
		async.series(tasks, done);
	};

	setTimeout(exec, conf.interval);
}

function createKey() {
	return PREFIX +
		info.address + '/' + info.port +
		'/' + serverType;
}

function parseKey(key) {
	const list = key.split('/');
	return {
		address: list[1],
		port: parseInt(list[2]),
		type: list[3]
	}; 
}

function createValue() {
	var value = '';
	for (const key in valueMap) {
		value += key + '/' + valueMap[key] + '/';
	}
	return value;
}

function parseValue(value) {
	if (!value) {
		return null;
	}
	const list = value.split('/');
	const res = {};
	var key;
	for (var i = 0, len = list.length; i < len; i++) {
		if (i % 2 === 0) {
			key = list[i];
			continue;	
		}
		var val = list[i];
		if (!isNaN(val)) {
			val = parseFloat(val);
		}
		res[key] = val;
	}
	return res;
}

function closeConnection() {
	logger.info('close connection to redis @', conf.host + ':' + conf.port);
	if (!rclient) {
		return;
	}
	try {
		rclient.quit();
		rclient = null;
	} catch (error) {
		logger.error('failed to close connection to redis @', conf.host + ':' + conf.port, error);
	}
}

function scan(cb) {
	if (!rclient) {
		return cb(new Error('RedisIsOffline'));
	}
	var cursor = 0;
	var list = [];
	const multi = rclient.multi();
	const callback = function __portalScanCallback(error, res) {
		if (error) {
			return cb(error);
		}
		cursor = parseInt(res[0]);
		list = list.concat(res[1]);
		if (cursor !== 0) {
			scanner();
			return;
		}
		for (var i = 0, len = list.length; i < len; i++) {
			multi.get(list[i]);
		}
		multi.exec(function __portalOnScanGet(error, results) {
			if (error) {
				return cb(error);
			}
			cb(null, createCache(list, results));
		});
	};
	const scanner = function __portalScanner() {
		if (!rclient) {
			return cb(new Error('RedisIsOffline')); 
		}
		rclient.scan(
			cursor,
			MATCH,
			PATTERN,
			COUNT,
			SCAN_COUNT,
			callback
		);				
	};
	
	scanner();
}

function createCache(list, results) {
	const tmp = {};
	for (var i = 0, len = results.length; i < len; i++) {
		const item = {
			key: parseKey(list[i]),
			value: parseValue(results[i])
		};
		const key = list[i].replace(PREFIX, '')
			.replace('/' + item.key.type, '');
		if (!tmp[item.key.type]) {
			tmp[item.key.type] = [];
		}
		tmp[item.key.type].push({
			address: item.key.address,
			port: item.key.port,
			key: key,
			value: item.value
		});
	}
	cache = tmp;
	logger.verbose('cache created:', info, cache);
}


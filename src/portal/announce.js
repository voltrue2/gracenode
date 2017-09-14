'use strict';

const redis = require('redis');
const async = require('../../lib/async');
const gn = require('../gracenode');
const delivery = require('./delivery');

const PREFIX = '__portal/';
const DEFAULT_TYPE = 'normal';
const SCAN_COUNT = 1000;
const PATTERN = PREFIX + '*';
const MATCH = 'MATCH';
const COUNT = 'COUNT';

const conf = {
	type: DEFAULT_TYPE,
	host: '127.0.0.1',
	port: 6379,
	interval: 1000
};
const valueMap = {};
const onAnnounceCallbacks = [];

var cache = {};
var logger;
var info;
var rclient;

module.exports.config = function (_conf) {
	logger = gn.log.create('portal.announce');
	if (_conf.type) {
		if (_conf.type.search(/\//) !== -1) {
			logger.warn(
				'Configuration "type" must NOT have "/"',
				'and "/" converted to "-"',
				_conf.type
			);	
			_conf.type = _conf.type.replace(/\//g, '-');
		}
		conf.type = _conf.type;
	}
	if (_conf.announce) {
		if (_conf.announce.host) {
			conf.host = _conf.announce.host;
		}
		if (_conf.announce.port) {
			conf.port = _conf.announce.port;
		}
		if (_conf.announce.interval) {
			conf.interval = _conf.announce.interval;
		}
	}
};

module.exports.setup = function (cb) {
	if (gn.isCluster() && gn.isMaster()) {
		return cb();
	}
	logger.info(
		'connecting to redis @',
		conf.host + ':' + conf.port
	);
	rclient = redis.createClient(conf);
	rclient.on('ready', function () {
		logger.info(
			'connected redis @',
			conf.host + ':' + conf.port
		);
		info = delivery.info();
		startAnnounceAndRead();
		cb();
	});
	rclient.on('reconnect', function () {
		logger.info(
			'connection to redis',
			'has been lost and reconnected @',
			conf.host + ':' + conf.port
		);
	});
	rclient.on('error', function (error) {
		logger.error(
			'connection to redis detected an error:',
			conf.host + ':' + conf.port, error
		);
		closeConnection();
	});
	gn.onExit(function portalAnnounceShutdown(next) {
		closeConnection();
		next();
	});
};

module.exports.onAnnounce = function (func) {
	onAnnounceCallbacks.push(func);
};

module.exports.setValue = function (key, value) {
	if (value !== null && typeof value === 'object') {
		logger.error(
			'requires value to be a string or a number:',
			key, value
		);
		throw new Error('InvalidAnnounceValue');
	}
	if (key.search(/\//) !== -1) {
		logger.warn(
			'Key of value must NOT have "/"',
			'and "/" converted to "-"',
			key
		);
		key = key.replace(/\//g, '-');
	}
	if (value.search(/\//) !== -1) {
		logger.warn(
			'Value must NOT have "/"',
			'and "/" converted to "-"',
			value
		);
		value = value.replace(/\//g, '-');
	}
	valueMap[key] = value;
};

module.exports.getNodes = function (type) {
	if (cache[type]) {
		return cache[type];
	}
	return [];
};

module.exports.getAllNodes = function () {
	var list = [];
	for (const type in cache) {
		list = list.concat(cache[type]);
	}
	return list;
};

function startAnnounceAndRead() {
	var ttl = conf.interval * 10 / 1000;
	var onAnnounce = function (next) {
		for (var i = 0, len = onAnnounceCallbacks.length; i < len; i++) {
			onAnnounceCallbacks[i]();
		}
		next();
	};
	var announce = function __portalAnnounce(next) {
		if (!rclient) {
			return done();
		}
		var multi = rclient.multi();
		var key = createKey();
		multi.set(key, createValue());
		multi.expire(key, ttl);
		multi.exec(function __portalOnAnnounce(error) {
			if (error) {
				logger.error('announce failed:', error);
			}
			next();
		});
	};
	var read = function __portalRead(next) {
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
	var done = function (error) {
		if (error) {
			logger.error(error);
		}
		setTimeout(exec, conf.interval);
	};
	var tasks = [
		onAnnounce,
		announce,
		read
	];
	var exec = function () {
		async.series(tasks, done);
	};

	setTimeout(exec, conf.interval);
}

function createKey() {
	return PREFIX +
		info.address + '/' + info.port +
		'/' + conf.type;
}

function parseKey(key) {
	var list = key.split('/');
	return {
		address: list[1],
		port: parseInt(list[2]),
		type: list[3]
	}; 
}

function createValue() {
	var value = '';
	for (var key in valueMap) {
		value += key + '/' + valueMap[key] + '/';
	}
	return value;
}

function parseValue(value) {
	if (!value) {
		return null;
	}
	var list = value.split('/');
	var res = {};
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
	logger.info(
		'close connection to redis @',
		conf.host + ':' + conf.port
	);
	if (!rclient) {
		return;
	}
	try {
		rclient.quit();
		rclient = null;
	} catch (error) {
		logger.error(
			'failed to close connection to redis @',
			conf.host + ':' + conf.port, error
		);
	}
}

function scan(cb) {
	if (!rclient) {
		return cb(new Error('RedisIsOffline'));
	}
	var cursor = 0;
	var list = [];
	var multi = rclient.multi();
	var callback = function __portalScanCallback(error, res) {
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
	var scanner = function __portalScanner() {
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
	var tmp = {};
	for (var i = 0, len = results.length; i < len; i++) {
		var item = {
			key: parseKey(list[i]),
			value: parseValue(results[i])
		};
		var key = list[i].replace(PREFIX, '')
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


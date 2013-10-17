
var gracenode = require('../../gracenode');
var log = gracenode.log.create('session');
var Memcache = require('memcached');
var crypto = require('crypto');

var config = null;

/*
* session: {
*	hosts: [],
	ttl: integer in second
	options: {}
* }
*/
module.exports.readConfig = function (configIn) {
	if (!configIn || !configIn.ttl || !configIn.hosts) {
		throw new Error('missing configurations: \n' + JSON.stringify(configIn));
	}
	config = configIn;
};

module.exports.getSession = function (sessionId, cb) {
	if (!sessionId) {
		log.verbose('found session [false]: null');
		return cb(null, null);
	}
	var key = getKey(sessionId);
	log.verbose('get session: (key: ' + key + ')');
	var mem = new Memcache(config.hosts, config.options || null);
	mem.get(key, function (error, value) {
		if (error) {
			return cb(error);
		}
		log.verbose('found session [' + (value ? true : false) + ']:', value);
		cb(null, value);
	});
};

module.exports.setSession = function (unique, value, cb) {
	var sessionId = createSessionId(unique);
	var key = getKey(sessionId);
	var mem = new Memcache(config.hosts, config.options || null);
	log.verbose('setting session: ' + key);	
	mem.set(key, value, config.ttl, function (error) {
		if (error) {
			return cb(error);
		}
		log.verbose('set session: (key: ' + key + '):', value);
		cb(null, sessionId);
	});
};

function getKey(sessionId) {
	return 'sess/' + sessionId;	
}

function createSessionId(unique) {
	var md5 = crypto.createHash('md5');
	var d = new Date();
	var src = unique + gracenode.lib.randomInt(0, 300).toString() + d.getTime().toString();
	return md5.update(src).digest('hex');
}

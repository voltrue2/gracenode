
var gracenode = require('../../');
var log = gracenode.log.create('session');
var Memcache = require('memcached');
var crypto = require('crypto');

var config = null;

// timestamp taken at the start of GraceNode > this will make all session invalid on every restart
var sessionVersion = 0;

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

module.exports.setup = function (cb) {
	sessionVersion = Date.now() + ':';
	cb();
};

module.exports.getSession = function (sessionId, cb) {
	if (!sessionId) {
		log.verbose('no session id');
		return cb(null, null);
	}
	var key = getKey(sessionId);
	log.verbose('get session: (key: ' + key + ')');
	var mem = new Memcache(config.hosts, config.options || null);
	mem.get(key, function (error, value) {
		if (error) {
			return cb(error);
		}
		
		log.verbose('found session (id: ' + sessionId + ') [' + (value ? true : false) + ']');
		
		if (value) {
			// session value found > update session
			return mem.set(key, value, config.ttl, function (error) {
				if (error) {
					return cb(error);
				}
	
				log.verbose('session updated: ' + key);

				cb(null, value);
			});
		}		

		// no session value found
		cb(null, null);
	});
};

module.exports.setSession = function (unique, value, cb) {
	var sessionId = createSessionId(unique);
	var key = getKey(sessionId);
	var mem = new Memcache(config.hosts, config.options || null);
	log.verbose('setting session: ' + key, config.ttl, value);	
	mem.set(key, value, config.ttl, function (error) {
		if (error) {
			return cb(error);
		}
		log.verbose('set session: (key: ' + key + '):', value);
		cb(null, sessionId);
	});
};

module.exports.delSession = function (sessionId, cb) {
	var key = getKey(sessionId);
	var mem = new Memcache(config.hosts, config.options || null);
	log.verbose('deleting session: ' + key);	
	mem.del(key, function (error) {
		if (error) {
			return cb(error);
		}
		log.verbose('delete session: (key: ' + key + '):');
		cb(null);
	});

};

function getKey(sessionId) {
	return 'sess/' + sessionId + sessionVersion;	
}

function createSessionId(unique) {
	var md5 = crypto.createHash('md5');
	var d = new Date();
	var src = unique + gracenode.lib.randomInt(0, 300).toString() + d.getTime().toString();
	return md5.update(src).digest('hex');
}

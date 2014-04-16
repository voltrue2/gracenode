var crypto = require('crypto');
var gn = require('../../');
var logger = gn.log.create('session');

var config;
var getter;
var setter;
var remover;
var flusher;

function validate(func) {
	if (typeof func !== 'function') {
		logger.error('expected to be a function');
		return false;
	}
	return true;
}

function createSessionId(unique) {
	var md5 = crypto.createHash('md5');
	var d = new Date();
	var src = unique + gn.lib.randomInt(0, 300).toString() + d.getTime().toString();
	return md5.update(src).digest('hex');
}

module.exports.readConfig = function (configIn) {
	if (!configIn || !configIn.ttl) {
		return new Error('invalid configurations give:\n', JSON.stringify(configIn));
	}
	config = configIn;
};

module.exports.setGetter = function (func) {
	getter = func;
};

module.exports.setSetter = function (func) {
	setter = func;
};

module.exports.setRemover = function (func) {
	remover = func;
};

module.exports.setFlusher = function (func) {
	flusher = func;
};

module.exports.getSession = function (id, cb) {
	if (!validate(getter)) {
		return cb(new Error('invalidGetterFunction'));
	}

	logger.verbose('get session (sessionId:' + id + ')');

	getter(id, function (error, session) {
		if (error) {
			logger.error('failed to get a session:', error);
			return cb(new Error('failedToGetSession'));
		}
		if (!session) {
			// session object not found
			logger.error('session not found (sessionId:' + id + ')');
			return cb(null, null);
		}
		// check expiration
		var now = Date.now();
		if (session.ttl - now <= 0) {
			// this session has already been expired
			logger.error('session expired (sessionId:' + id + ')');
			return cb(null, null);
		}
		// update session
		if (!validate(setter)) {
			return cb(new Error('invalidSetterFunction'));
		}
		// update ttl
		session.ttl = now + config.ttl;
		setter(id, session, function (error) {
			if (error) {
				logger.error('failed to set a session:', error);
				return cb(new Error('failedToSetSession'));
			}
			
			logger.verbose('set session (sessionId:' + id + ')');
			
			cb(null, session.data);
		});
	});
};

module.exports.setSession = function (key, data, cb) {
	if (!validate(setter)) {
		return cb(new Error('invalidSetterFunction'));
	}
	var session = {
		data: data,
		ttl: Date.now() + config.ttl
	};
	var id = createSessionId(key);
	setter(id, session, function (error) {
		if (error) {
			logger.error('failed to set a session:', error);
			return cb(new Error('failedToSetSession'));
		}
		
		logger.verbose('set session (sessionId:' + id + ')');
		
		cb(null, id);
	});
};

module.exports.delSession = function (key, cb) {
	if (!validate(remover)) {
		return cb(new Error('invalidRemoverFunction'));
	}
	var id = createSessionId(key);
	remover(id, function (error) {
		if (error) {
			logger.error('failed to remove a session:', error);
			return cb('fialedToRemoveSession');
		}
		
		logger.verbose('delete session (sessionId:' + id + ')');
		
		cb();
	});
};

module.exports.flushSession = function (cb) {
	if (!validate(flusher)) {
		return cb(new Error('invalidFlusherFunction'));
	}
	flusher(function (error) {
		if (error) {
			logger.error('failed to flush all sessions:', error);
			return cb(new Error('failedToFlushAllSessions'));
		}
		
		logger.verbose('all session flushed');

		cb();
	});
};

module.exports.get = module.exports.getSession;
module.exports.set = module.exports.setSession;
module.exports.del = module.exports.delSession;
module.exports.flush = module.exports.flushSession;

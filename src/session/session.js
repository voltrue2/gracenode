'use strict';

var gn = require('../gracenode');

var logger;
var set;
var get;
var del;
var options = {
	useCookie: true,
	oneTime: false,
	ttl: 1000 * 60 * 60
};
var using = {
	http: false,
	rpc: false,
	udp: false
};
// development use only by default: this does NOT support cluster mode
var inMemStorage = {};

var SESSION_ID_NAME = 'sessionid';

module.exports.setup = function () {
	logger = gn.log.create('session');
	if (using.http) {
		logger.info('session for HTTP enabled');
		logger.info('session uses cookie:', options.useCookie);
		logger.info('session renews ID every time:', options.oneTime);
	}
	if (using.udp) {
		logger.info('session for UDP enabled');
	}
	if (using.rpc) {
		logger.info('session for RPC enabled');
	}
};

module.exports.defineSet = function (func) {
	if (typeof func !== 'function') {
		throw new Error('<SESSION_SET_MUST_BE_FUNCTION>');
	}
	set = func;
};

module.exports.defineDel = function (func) {
	if (typeof func !== 'function') {
		throw new Error('<SESSION_DEL_MUST_BE_FUNCTION>');
	}
	del = func;
};

module.exports.defineGet = function (func) {
	if (typeof func !== 'function') {
		throw new Error('<SESSION_GET_MUST_BE_FUNCTION>');
	}
	get = func;
};

module.exports.useCookie = function (val) {
	options.useCookie = (val === true) ? true : false;
};

module.exports.oneTimeSessionId = function (val) {
	options.oneTime = (val === true) ? true : false;
};

module.exports.sessionDuration = function (msec) {
	options.ttl = msec;
};

module.exports.useHTTPSession = function (routes) {
	for (var i = 0, len = routes.length; i < len; i++) {
		gn.http.hook(routes[i], HTTPSessionValidation);
	}
	if (routes.length) {
		using.http = true;
	}
};

module.exports.useRPCSession = function () {
	using.rpc = true;
	gn.rpc.useDecryption(socketSessionValidation);
	gn.rpc.useEncryption(socketSessionEncryption);
};

module.exports.useUDPSession = function () {
	using.udp = true;
	gn.udp.useDecryption(socketSessionValidation);
	gn.udp.useEncryption(socketSessionEncryption);
};

// this needs to be manually called in the application
// typically in login etc
module.exports.setHTTPSession = function (req, res, sessionData, cb) {
	var uuid = gn.lib.uuid.v4();
	var id = uuid.toString();

	if (options.useCookie) {
		logger.verbose('setting session ID to cookies');
		var cookies = req.cookies();
		cookies.set(SESSION_ID_NAME, id);
	} else {
		logger.verbose('session session ID to response headers');
		res.headers[SESSION_ID_NAME] = id;
	}

	if (set) {
		logger.verbose('custom setter is defined');
		req.args.sessionId = id;
		req.args.session = sessionData;
		var data = {
			ttl: Date.now() + options.ttl,
			data: sessionData
		};
		if (using.udp || using.rpc) {
			data.cipher = createSocketCipher();
			req.args.cipher = data.cipher;
		}
		return set(id, data, cb);
	}

	logger.warn('set is using default in-memory storage: Not for production');
	
	inMemStorage[id] = {
		ttl: Date.now() + options.ttl,
		seq: 0,
		data: sessionData
	};
	if (using.udp || using.rpc) {
		inMemStorage[id].cipher = createSocketCipher();
		req.args.cipher = inMemStorage[id].cipher;
	}
	
	req.args.sessionId = id;
	req.args.session = sessionData;
	cb();
};

// this needs to be manually called in the application
// typically logout
module.exports.delHTTPSession = function (req, res, cb) {
	var id;

	if (options.useCookie) {
		var cookies = req.cookies();
		id = cookies.get(SESSION_ID_NAME);	
	} else {
		id = req.headers[SESSION_ID_NAME];
	}

	if (!id) {
		return cb(new Error('SessionIdNotFound'));
	}

	if (del) {
		logger.verbose('custom delete is defined');
		return del(id, cb);
	}

	logger.warn('del is using default in-memory storage: Not for production');

	delete inMemStorage[id];

	cb();
};

function socketSessionValidation(packet, next) {
	var ce = new gn.lib.CryptoEngine();
	var res = ce.getSessionIdAndPayload(packet);
	
	if (get && set) {
		logger.verbose('custom getter is defined');
		get(res.sessionId, function (error, sessionData) {
			if (error) {
				return next(error);
			}
			if (!sessionData) {
				logger.error('session not found:', res.sessionId);
				return next(new Error('SessionNotFound'));
			}
			if (res.seq <= sessionData.seq) {
				// we do NOT allow incoming seq that is smaller or the same as stored in the session
				// this is to prevent duplicated command execution
				logger.error('invalid seq:', res.sessionId);
				return next(new Error('InvalidSeq'));
			}
			// check session TTL
			if (sessionData.ttl <= Date.now()) {
				logger.error('session ID has expired:', res.sessionId);
				return next(new Error('SessionExpired'));
			}
			// update session and move on
			sessionData.ttl = Date.now() + options.ttl;
			sessionData.seq = res.seq;
			if (sessionData.seq > 0xffffffff) {
				sessionData.seq = 0;
			}
			set(res.sessionId, sessionData, function (error) {
				if (error) {
					return next(error);
				}
				socketSessionDecrypt(ce, res, sessionData, next);
			});
		});
		return;
	}

	logger.warn('get is using defailt in-memory storage: Not for production');
	
	var sess = inMemStorage[res.sessionId];

	if (!sess) {
		logger.error('session not found:', res.sessionId);
		return next(new Error('SessionNotFound'));
	}
	if (sess.ttl <= Date.now()) {
		logger.error('session ID has expired:', res.sessionId);
		return next(new Error('SessionExpired'));
	}
	// update session and move on
	sess.ttl = Date.now() + options.ttl;
	sess.seq = res.seq;
	if (sess.seq > 0xffffffff) {
		sess.seq = 0;
	}
	inMemStorage[res.sessionId] = sess;

	socketSessionDecrypt(ce, res, sess, next);
}

function socketSessionDecrypt(ce, res, sess, next) {
	var decrypted = ce.decrypt(
		sess.cipher.cipherKey,
		sess.cipher.cipherNounce,
		sess.cipher.macKey,
		res.seq,
		res.payload
	);
	next(null, res.sessionId, res.seq, sess, decrypted);
}

function socketSessionEncryption(state, msg, next) {
	var ce = new gn.lib.CryptoEngine();
	var sess = state.session;
	var encrypted = ce.encrypt(
		sess.cipher.cipherKey,
		sess.cipher.cipherNounce,
		sess.cipher.macKey,
		state.seq,
		msg
	);
	next(null, encrypted);
}

function HTTPSessionValidation(req, res, next) {
	var id = getHTTPSessionId(req);
	var newId = null;

	if (!id) {
		logger.error(
			'session ID not found in:',
			(options.useCookie ? 'cookies' : 'request headers')
		);
		return next(new Error('SessionIdNotFound'), 401);
	}

	if (options.oneTime) {
		newId = gn.lib.uuid.v4().toString();
		// if not using cookie and oneTime is true
		// update the session ID in response headers
		if (!options.useCookie) {
			res.headers[SESSION_ID_NAME] = newId;
		}
	}

	if (get && set) {
		logger.verbose('custom getter is defined');
		get(id, function (error, sessData) {
			if (error) {
				return next(error, 401);
			}
			if (!sessData) {
				return next(new Error('SessionNotFound'), 401);
			}
			// check for TTL
			if (sessData.ttl <= Date.now()) {
				logger.error('session ID has expired:', id);
				return next(new Error('SessionExpired'), 401);
			}
			// append it to req.args for easy access
			req.args.sessionId = id;
			req.args.session = sessData.data;
			// update session and move on
			sessData.ttl = Date.now() + options.ttl;
			if (newId) {
				id = newId;
			}
			set(id, sessData, next);
		});
		return;
	}

	logger.warn('get is using default in-memory storage: Not for production');

	var sess = inMemStorage[id];

	if (!sess) {
		logger.error('session not found by session ID:', id);
		return next(new Error('SessionNotFound'), 401);
	}

	// check for TTL
	if (sess.ttl <= Date.now()) {
		logger.error('session ID has expired:', id);
		return next(new Error('SessionExpired'), 401);
	}

	// found a valid session. update TTL
	sess.ttl = Date.now() + options.ttl; 
	// append it to req.args object for easy access
	req.args.sessionId = id;
	req.args.session = sess.data;
	if (newId) {
		id = newId;
	}
	inMemStorage[id] = sess;
	// move on
	next();
}

function getHTTPSessionId(req) {
	if (options.useCookie) {
		var cookies = req.cookies();
		return cookies.get(SESSION_ID_NAME) || null;
	}
	// if not using cookie, we assume to get it from request header or request query
	return req.headers[SESSION_ID_NAME] || (req.query[SESSION_ID_NAME] || null);
}

function createSocketCipher() {
	return gn.lib.CryptoEngine.createCipher();
}

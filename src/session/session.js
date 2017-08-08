'use strict';

var gn = require('../gracenode');
var mem = require('./mem');
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
var setup = false;
const SESSION_ID_NAME = 'sessionid';
const PROTO_RPC = 'RPC';
const PROTO_UDP = 'UDP';

mem.setDuration(options.ttl);

module.exports.PROTO = {
	RPC: PROTO_RPC,
	UDP: PROTO_UDP
};

module.exports.setup = function __sessSetup() {
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

	if (set || get || del) {
		if (!set) {
			throw new Error('<SESSION_CUSTOM_SET_MISSING>');
		}
		if (!get) {
			throw new Error('<SESSION_CUSTOM_GET_MISSING>');
		}
		if (!del) {
			throw new Error('<SESSION_CUSTOM_DEL_MISSING>');
		}
	}
	
	setup = true;

	mem.setup();
};

module.exports.defineSet = function __sessDefineSet(func) {
	if (setup) {
		logger.warn('.defineSet() should not be called after gracenode.start()');
	}
	if (typeof func !== 'function') {
		throw new Error('<SESSION_SET_MUST_BE_FUNCTION>');
	}
	set = func;
};

module.exports.defineDel = function __sessDefineDel(func) {
	if (setup) {
		logger.warn('.defineDel() should not be called after gracenode.start()');
	}
	if (typeof func !== 'function') {
		throw new Error('<SESSION_DEL_MUST_BE_FUNCTION>');
	}
	del = func;
};

module.exports.defineGet = function __sessDefineGet(func) {
	if (setup) {
		logger.warn('.defineGet() should not be called after gracenode.start()');
	}
	if (typeof func !== 'function') {
		throw new Error('<SESSION_GET_MUST_BE_FUNCTION>');
	}
	get = func;
};

module.exports.useCookie = function __sessUseCookie(val) {
	options.useCookie = (val === false) ? false : true;
};

module.exports.oneTimeSessionId = function __sessOnTimeSessionId(val) {
	options.oneTime = (val === false) ? false : true;
};

module.exports.sessionDuration = function __sessSessionDurtion(msec) {
	options.ttl = msec;
	mem.setDuration(msec);
};

module.exports.useHTTPSession = function __sessUseHTTPSession(routes) {
	for (var i = 0, len = routes.length; i < len; i++) {
		gn.http.hook(routes[i], HTTPSessionValidation);
	}
	if (routes.length) {
		using.http = true;
	}
};

module.exports.useRPCSession = function __sessUseRpcSession() {
	using.rpc = true;
	gn.rpc.useDecryption(socketSessionValidation);
	gn.rpc.useEncryption(socketSessionEncryption);
};

module.exports.useUDPSession = function __sessUseUDPSession() {
	using.udp = true;
	gn.udp.useDecryption(socketSessionValidation);
	gn.udp.useEncryption(socketSessionEncryption);
};

// this needs to be manually called in the application
// typically in login etc
module.exports.setHTTPSession = function __sessSetHTTPSession(req, res, sessionData, cb) {
	const uuid = gn.lib.uuid.v4();
	const id = uuid.toString();

	if (options.useCookie) {
		var cookies = req.cookies();
		cookies.set(SESSION_ID_NAME, id);
	} else {
		res.headers[SESSION_ID_NAME] = id;
	}

	if (set) {
		req.args.sessionId = id;
		req.args.session = sessionData;
		var data = {
			seq: 0,
			ttl: gn.lib.now() + options.ttl,
			data: sessionData
		};
		if (using.udp || using.rpc) {
			data.cipher = createSocketCipher();
			req.args.cipher = data.cipher;
		}
		if (using.udp && using.rpc) {
			// when we share the same session for RPC and UDP, we create 2 separate sessions
			set(PROTO_RPC + id, data, function __sessOnSet(error) {
				if (error) {
					return cb(error);
				}
				set(PROTO_UDP + id, data, cb);
			});
			return;
		}
		return set(id, data, cb);
	}
	
	if (using.udp || using.rpc) {
		sessionData.seq = 0;
		sessionData.cipher = createSocketCipher();
		req.args.cipher = sessionData.cipher;
	}
	if (using.udp && using.rpc) {
		// when we share the same session for RPC and UDP, we create 2 separate sessions
		mem.set(PROTO_RPC + id, sessionData, function __sessOnMemRPCSet(error) {
			if (error) {
				return cb(error);
			}
			mem.set(PROTO_UDP + id, sessionData, function __sessOnMemUDPSet(error) {
				if (error) {
					return cb(error);
				}
				req.args.sessionId = id;
				req.args.session = sessionData;
				cb();
			});
		});
		return;
	}
	mem.set(id, sessionData, function __sessOnMemSet(error) {
		if (error) {
			return cb(error);
		}
		req.args.sessionId = id;
		req.args.session = sessionData;
		cb();
	});
};

// this needs to be manually called in the application
// typically logout
module.exports.delHTTPSession = function __sessDelHTTPSession(req, res, cb) {
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
		if (using.udp && using.rpc) {
			del(PROTO_RPC, function __sessOnDel(error) {
				if (error) {
					return cb(error);
				}
				del(PROTO_UDP, cb);
			});
			return;
		}
		return del(id, cb);
	}

	if (using.udp && using.rpc) {
		mem.del(PROTO_RPC, function __sessOnMemRPCDel(error) {
			if (error) {
				return cb(error);
			}
			mem.del(PROTO_UDP, cb);
		});
		return;
	}
	mem.del(id, cb);
};

function socketSessionValidation(packet, sockType, remoteIp, remotePort, next) {
	var ce = gn.lib.CryptoEngine;
	var res = ce.getSessionIdAndPayload(packet);
	if (res instanceof Error) {
		return next(res);
	}
	var sid = res.sessionId;
	if (using.udp && using.rpc) {
		sid = sockType + res.sessionId;
	}
	if (get && set) {
		get(sid, function __sessOnSockValGet(error, sessionData) {
			if (error) {
				return next(error);
			}
			_socketSessionValidation(
				res,
				sockType,
				remoteIp,
				remotePort,
				sessionData,
				function __sessOnSockVal(error) {
				if (error) {
					return next(error);
				}
				set(sid, sessionData, function __sessOnSockValSet(error) {
					if (error) {
						return next(error);
					}
					socketSessionDecrypt(ce, res, sessionData, next);
				});
			});
		});
		return;
	}
	logger.warn('get is using default in-memory storage: Not for production');
	mem.get(sid, function __sessOnSockValMemGet(error, sess) {
		if (error) {
			logger.error('session not found:', sid);
			return next(error);
		}
		_socketSessionValidation(
			res,
			sockType,
			remoteIp,
			remotePort,
			sess,
			function __sessOnSockValMem(error) {
			if (error) {
				return next(error);
			}
			mem.set(sid, sess, function __sessOnSockValMemSet(error) {
				if (error) {
					return next(error);
				}
				socketSessionDecrypt(ce, res, sess, next);
			});
		});
	});
}

// get rid of the code redundancy in secketSessionValidation
// modifies sess object to be updated
function _socketSessionValidation(res, sockType, remoteIp, remotePort, sess, next) {
	if (!sess) {
		logger.error('session not found:', sockType + res.sessionId);
		return next(new Error('SessionNotFound'));
	}
	if (res.seq <= sess.seq) {
		// we do NOT allow incoming seq that is smaller or the same as stored in the session
		// this is to prevent duplicated command execution
		logger.error(
			'invalid seq for session', sockType + res.sessionId,
			'incoming seq:', res.seq, 'must be greater then', sess.seq
		);
		return next(new Error('InvalidSeq'));
	}
	// check session TTL
	const now = gn.lib.now();
	if (sess.ttl <= now) {
		logger.error(
			'session ID has expired:',
			sockType + res.sessionId, sess.ttl + ' <= ' + now
		);
		return next(new Error('SessionExpired'));
	}
	// handle initial handshake to keep the client IP and port in the session
	if (!sess.client) {
		sess.client = {};
	}
	if (!sess.client[sockType]) {
		sess.client[sockType] = {
			ip: remoteIp,
			port: remotePort
		};
	}
	// check for client IP and port
	if (sockType === PROTO_RPC) {
		if (sess.client[sockType].ip !== remoteIp || sess.client[sockType].port !== remotePort) {
			logger.error(
				'invalid client IP address detected:',
				sockType,
				remoteIp,
				'session:', sockType + res.sessionId
			);
			return next('InvalidClient');
		}
	} else if (sockType === PROTO_UDP) {
		if (sess.client[sockType].ip !== remoteIp) {
			logger.error(
				'invalid client IP address detected:',
				sockType,
				remoteIp,
				'session:', sockType + res.sessionId
			);
			return next('InvalidClient');
		}
	}
	// update session and move on
	sess.seq = res.seq;
	if (sess.seq > 0xffffffff) {
		sess.seq = 0;
	}
	next();
}

function socketSessionDecrypt(ce, res, sess, next) {
	var src = {
		cipherKey: sess.cipher.cipherKey,
		cipherNonce: sess.cipher.cipherNonce,
		macKey: sess.cipher.macKey
	};
	var decrypted = ce.decrypt(res.sessionId, src, res.seq, res.payload);
	if (decrypted instanceof Error) {
		logger.error(
			'session decryption failed;', decrypted,
			'session ID:', res.sessionId,
			sess
		);
		return next(decrypted);
	}
	next(null, res.sessionId, res.seq, sess, decrypted);
}

function socketSessionEncryption(state, msg, next) {
	var ce = gn.lib.CryptoEngine;
	var sess = state.session;
	var src = {
		cipherKey: sess.cipher.cipherKey,
		cipherNonce: sess.cipher.cipherNonce,
		macKey: sess.cipher.macKey,
	};
	// seq is 0 b/c server push never needs to care
	var encrypted = ce.encrypt(sess.sessionId, src, 0, msg);
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
		const prevId = id;
		newId = gn.lib.uuid.v4().toString();
		// update the session ID in response headers
		if (!options.useCookie) {
			res.headers[SESSION_ID_NAME] = newId;
		} else {
			var cookies = req.cookies();
			cookies.set(SESSION_ID_NAME, newId);
		}
		// we delete the current session b/c session ID is used once
		var _next = next;
		next = function __sessHTTPSessValNext(error) {
			if (error) {
				return _next(error, 401);
			}
			if (del) {
				return del(prevId, _next);
			}
			delete inMemStorage[prevId];
			_next();
		};
	}

	if (get && set) {
		get(id, function __sessHTTPSessValGet(error, sessData) {
			if (error) {
				return next(error, 401);
			}
			if (!sessData) {
				return next(new Error('SessionNotFound'), 401);
			}
			// check for TTL
			if (sessData.ttl <= gn.lib.now()) {
				logger.error('session ID has expired:', id);
				return next(new Error('SessionExpired'), 401);
			}
			// append it to req.args for easy access
			req.args.sessionId = id;
			req.args.session = sessData.data;
			// update session and move on
			sessData.ttl = gn.lib.now() + options.ttl;
			if (newId) {
				id = newId;
			}
			set(id, sessData, next);
		});
		return;
	}

	logger.warn('get is using default in-memory storage: Not for production');

	mem.get(id, function __sessHTTPSessValMemGet(error, sess) {
		if (error) {
			logger.error('session not found by session ID:', id);
			return next(error, 401);
		}
		// append it to req.args object for easy access
		req.args.sessionId = id;
		req.args.session = sess;
		if (newId) {
			// one time session ID
			return mem.set(newId, sess, next);
		}
		// move on
		next();
	});
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
	var cipher = gn.lib.CryptoEngine.createCipher();
	cipher.base64 = {
		cipherKey: cipher.cipherKey.toString('base64'),
		cipherNonce: cipher.cipherNonce.toString('base64'),
		macKey: cipher.macKey.toString('base64')
	};
	return cipher;
}

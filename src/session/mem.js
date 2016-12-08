'use strict';

// in memory session storage using cluster-mode to support multi workers
var gn = require('../gracenode');

const CMD_GET = '__sget__';
const CMD_SET = '__sset__';
const CMD_DEL = '__sdel__';

var data = {};
var logger;
var dur;

module.exports.setDuration = function __sessMemSetDuration(d) {
	dur = d;
};

module.exports.setup = function __sessMemSetup() {
	if (gn.isMaster()) {
		gn.cluster.registerCommand(CMD_GET, function __sessMemMasterGet(msg, cb) {
			removeExpired();
			var copy = gn.lib.deepCopy(data);
			var sess = copy[msg.sid];
			if (!sess) {
				return cb(new Error('SessionNotFound'));
			}
			// update ttl
			data[msg.sid].ttl = Date.now() + dur;
			cb(null, sess.data);
		});
		gn.cluster.registerCommand(CMD_SET, function __sessMemMasterSet(msg, cb) {
			removeExpired();
			data[msg.sid] = {
				ttl: Date.now() + dur,
				data: msg.data 
			};
			cb();
		});
		gn.cluster.registerCommand(CMD_DEL, function __sessMemMasterDel(msg, cb) {
			removeExpired();
			if (data[msg.sid]) {
				delete data[msg.sid];
			}
			cb();
		});
	}
	logger = gn.log.create('session.mem');
};

module.exports.get = function __sessMemGet(id, cb) {
	logger.warn('(get) using memory storage for session is NOT meant for production');
	if (gn.isCluster()) {
		var params = { sid: id };
		gn.cluster.sendCommand(CMD_GET, params, function __sessMemOnGet(error, res) {
			if (error) {
				return cb(error);
			}
			cb(null, res);
		});
		return;
	}
	removeExpired();
	if (!data[id]) {
		return cb(new Error('SessionNotFound'));
	}
	// update ttl
	data[id].ttl = Date.now() + dur;
	cb(null, data[id].data);
};

module.exports.set = function __sessMemSet(id, sess, cb) {
	logger.warn('(set) using memory storage for session is NOT meant for production');
	if (gn.isCluster()) {
		var params = {
			sid: id,
			data: sess
		};
		return gn.cluster.sendCommand(CMD_SET, params, cb);
	}
	removeExpired();
	data[id] = {
		ttl: Date.now() + dur,
		data: sess
	};
	cb();
};

module.exports.del = function __sessMemDel(id, cb) {
	logger.warn('(del) using memory storage for session is NOT meant for production');
	if (gn.isCluster()) {
		var params = {
			sid: id
		};
		return gn.cluster.sendCommand(CMD_DEL, params, cb);
	}
	removeExpired();
	if (data[id]) {
		delete data[id];
	}
	cb();
};

function removeExpired() {
	const now = Date.now();
	for (var id in data) {
		if (now >= data[id].ttl) {
			logger.verbose('session expired:', id, now, '>=', data[id].ttl);
			delete data[id];
		}
	}
}

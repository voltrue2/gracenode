'use strict';

// in memory session storage using cluster-mode to support multi workers
var gn = require('../gracenode');

var CMD = {
	GET: '__sget__',
	SET: '__sset__',
	DEL: '__sdel__'
};

var data = {};
var logger;
var dur;

module.exports.setDuration = function (d) {
	dur = d;
};

module.exports.setup = function () {
	if (gn.isMaster()) {
		gn.cluster.registerCommand(CMD.GET, function (msg, cb) {
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
		gn.cluster.registerCommand(CMD.SET, function (msg, cb) {
			removeExpired();
			data[msg.sid] = {
				ttl: Date.now() + dur,
				data: msg.data 
			};
			cb();
		});
		gn.cluster.registerCommand(CMD.DEL, function (msg, cb) {
			removeExpired();
			if (data[msg.sid]) {
				delete data[msg.sid];
			}
			cb();
		});
	}
	logger = gn.log.create('session.mem');
};

module.exports.get = function (id, cb) {
	if (gn.isCluster()) {
		var params = { sid: id };
		gn.cluster.sendCommand(CMD.GET, params, function (error, res) {
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

module.exports.set = function (id, sess, cb) {
	if (gn.isCluster()) {
		var params = {
			sid: id,
			data: sess
		};
		return gn.cluster.sendCommand(CMD.SET, params, cb);
	}
	removeExpired();
	data[id] = {
		ttl: Date.now() + dur,
		data: sess
	};
	cb();
};

module.exports.del = function (id, cb) {
	if (gn.isCluster()) {
		var params = {
			sid: id
		};
		return gn.cluster.sendCommand(CMD.DEL, params, cb);
	}
	removeExpired();
	if (data[id]) {
		delete data[id];
	}
	cb();
};

function removeExpired() {
	var now = Date.now();
	for (var id in data) {
		if (now >= data[id].ttl) {
			logger.verbose('session expired:', id, now, '>=', data[id].ttl);
			delete data[id];
		}
	}
}

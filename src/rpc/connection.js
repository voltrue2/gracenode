'use strict';

var EventEmitter = require('events').EventEmitter;
var utils = require('util');
var gn = require('../gracenode');
var async = require('../../lib/async');
var transport = require('../../lib/transport');
// this is not HTTP router
var router = require('./router');
var logger;

module.exports.setup = function () {
	logger = gn.log.create('RPC.connection');
};

module.exports.create = function (sock, options) {
	return new Connection(sock, options);	
};

function Connection(sock, options) {
	EventEmitter.call(this);
	var you = sock.remoteAddress + ':' + sock.remotePort;
	var that = this;
	var heartbeat = gn.getConfig('rpc.heartbeat');
	this.sock = sock;
	this.opt = options;
	this.id = gn.lib.uuid.v4().toString();
	this.parser = new transport.Stream();
	this.crypto = options.cryptoEngine || null;
	this.connected = true;
	this.name = '{RPC:' + this.id + '|' + you + '}';
	this.heartbeatTime = Date.now();
	this.sock.on('data', function (packet) {
		that._data(packet);
	});
	this.sock.on('end', function () {
		logger.info(that.name, 'TCP connection ended by client');
	});
	this.sock.on('error', function (error) {
		logger.error(that.name, 'TCP connection error detected:', error);
	});
	this.sock.on('close', function () {
		that.close();
	});
	this.sock.on('timeout', function (error) {
		if (error) {
			return that.close(error);
		}
		that.close(new Error('TCP connection timeout'));
	});
	logger.info(this.name, 'RPC connection requires heartbeat at every', heartbeat.timeout, 'msec');
	var checker = function () {
		if (!that.connected) {
			return;
		}
		if (Date.now() - that.heartbeatTime >= heartbeat.timeout) {
			that.sock.emit('timeout', new Error('RPC heartbeat timeout'));
		}
		setTimeout(checker, heartbeat.checkFrequency);
	};
	checker();
}

utils.inherits(Connection, EventEmitter);

Connection.prototype.useCryptoEngine = function (engine) {
	this.crypto = engine;
};

Connection.prototype.close = function (error) {
	if (error) {
		logger.error(this.name, 'TCP connection closed by error:', error);
	} else {
		logger.info(this.name, 'TCP connection closed');
	}
	if (this.sock) {
		this.sock.end();
	}
	this._clear();
};

Connection.prototype.kill = function (error) {
	if (this.sock) {
		if (error) {
			logger.error(this.name, 'TCP connection killed from server:', error);
		} else {
			logger.info(this.name, 'TCP connection killed from server');
		}
		this.sock.destroy();
	}
	this._clear(true);
};

Connection.prototype._data = function (packet) {
	var that = this;
	var parsed = this.parser.parse(packet);
	if (parsed instanceof Error) {
		return this.kill(parsed);
	}
	this.heartbeatTime = Date.now();
	var done = function (error) {
		if (error) {
			return that.kill(error);
		}
	};
	async.eachSeries(parsed, function (parsedData, next) {
		if (!parsedData) {
			return next();
		}
		that._decrypt(parsedData, next);	
	}, done);
};

Connection.prototype._decrypt = function (parsedData, cb) {
	if (this.crypto && this.crypto.decrypt) {
		var that = this;
		this.crypto.decrypt(
			parsedData.payload,
			gn.session.PROTO.RPC,
			this.sock.remoteAddress,
			this.sock.remotePort,
			function (error, sid, seq, sdata, decrypted) {
				if (error) {
					return cb(error);
				}
				var sess = {
					sessionId: sid,
					seq: seq,
					data: sdata
				};
				parsedData.payload = decrypted;
				that._routeAndExec(parsedData, sess, cb);
			}
		);
		return;
	}
	this._routeAndExec(parsedData, null, cb);
};

Connection.prototype._routeAndExec = function (parsedData, sess, cb) {
	var cmd = router.route(parsedData);
	if (!cmd) {
		return this._errorResponse(parsedData, sess, cb);
	}
	logger.info(
		this.name,
		'command routing resolved:',
		'command:', cmd.id, cmd.name,
		'seq:', parsedData.seq
	);
	this._execCmd(cmd, parsedData, sess, cb);
};

Connection.prototype._errorResponse = function (parsedData, sess, cb) {
	var state = createState(this.id, parsedData, sess);
	var msg = { message: 'NOT_FOUND' };
	this._write(new Error('NOT_FOUND'), state, state.STATUS.NOT_FOUND, state.seq, msg, cb);
};

Connection.prototype._execCmd = function (cmd, parsedData, sess, cb) {
	var that = this;
	var state = createState(this.id, parsedData, sess);
	state.send = function (payload) {
		that._push(state, payload);
	};
	cmd.hooks(state, function (error, status) {
		if (error) {
			var msg = {
				message: error.message
			};
			if (!status) {
				status = transport.STATUS.BAD_REQ;
			}
			return that._write(error, state, status, parsedData.seq, msg, cb);
		}
		var res;
		var options;
		var done = function (error) {
			that._write(error, state, status, parsedData.seq, res, function (error) {
				if (options) {
					if (options.closeAfterReply) {
						return that.close();
					}
					if (options.killAfterReply) {
						return that.kill();
					}
				}
				cb(error);
			});
		};
		async.eachSeries(cmd.handlers, function (handler, next) {
			handler(state, function (_res, _status, _options) {
				options = _options;
				if (_res instanceof Error) {
					if (!_status) {
						_status = transport.STATUS.BAD_REQ;
					}
					status = _status;
					res = { message: _res.message };
					return next(_res);
				}
				if (!_status) {
					_status = transport.STATUS.OK;
				}
				status = _status;
				res = _res;
				next();
			});
		}, done);
	});	
};

Connection.prototype._write = function (_error, state, status, seq, msg, cb) {
	var that = this;
	if (typeof msg === 'object' && !(msg instanceof Buffer)) {
		msg = JSON.stringify(msg);
	}
	this._encrypt(state, msg, function (error, data) {
		data = transport.createReply(status, seq, data);
		if (error) {
			return that.__write(error, data, cb);
		}
		that.__write(_error, data, cb);
	});
};

Connection.prototype._push = function (state, msg, cb) {
	var that = this;
	if (typeof msg === 'object' && !(msg instanceof Buffer)) {
		msg = JSON.stringify(msg);
	}
	this._encrypt(state, msg, function (error, data) {
		if (error) {
			return cb(error);
		}
		that.__push(transport.createPush(0, data), cb);
	});
};

Connection.prototype.__write = function (error, data, cb) {
	if (!this.sock || !this.connected) {
		return cb();
	}
	if (error) {
		logger.error(this.name, 'error response:', error, 'size:', data.length, 'bytes');
	} else {
		logger.info(this.name, 'response:', data.length, 'bytes');
	}
	this.sock.write(data, 'UTF-8', cb);
};

Connection.prototype.__push = function (data, cb) {
	if (!this.sock || !this.connected) {
		if (!cb) {
			return;
		}
		return cb();
	}
	logger.info(this.name, 'push from server:', data.length, 'bytes');
	this.sock.write(data, 'UTF-8', cb);
};

Connection.prototype._encrypt = function (state, msg, cb) {
	if (this.crypto && this.crypto.encrypt) {
		this.crypto.encrypt(state, msg, function (error, data) {
			if (error) {
				return cb(error);
			}
			cb(null, data);
		});
		return;
	}
	cb(null, msg);
};

Connection.prototype._clear = function (killed) {
	this.connected = false;
	this.sock.removeAllListeners();
	this.sock = null;
	this.parser = null;
	this.opt = null;
	this.emit('clear', killed);
};

function createState(id, parsedData, sess) {
	var state = {
		STATUS: transport.STATUS,
		command: parsedData.command,
		payload: parsedData.payload,
		connId: id,
		sessionId: null,
		seq: null,
		session: null,
		send: null
	};
	if (sess) {
		state.sessionId = sess.sessionId;
		state.seq = sess.seq;
		state.session = sess.data;
	}
	return state;
}

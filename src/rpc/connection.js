'use strict';

var EventEmitter = require('events').EventEmitter;
var utils = require('util');
var gn = require('../gracenode');
var async = require('../../lib/async');
var transport = require('../../lib/transport');
var rpc = require('./rpc');
// this is not HTTP router
var router = require('./router');
var logger;
var heartbeatConf;

module.exports.setup = function __rpcConnectionSetup() {
	logger = gn.log.create('RPC.connection');
	heartbeatConf = gn.getConfig('rpc.heartbeat');
};

module.exports.create = function __rpcConnectionCreate(sock, options) {
	return new Connection(sock, options);	
};

function Connection(sock, options) {
	EventEmitter.call(this);
	const you = sock.remoteAddress + ':' + sock.remotePort;
	var that = this;
	this.sock = sock;
	this.opt = options;
	this.id = gn.lib.uuid.v4().toString();
	this.parser = new transport.Stream();
	this.crypto = options.cryptoEngine || null;
	this.connected = true;
	this.name = '{ID:' + this.id + '|p:' + sock.localPort + '|' + you + '}';
	this.heartbeatTime = Date.now();
	this.sock.on('data', function __rpcConnectionOnData(packet) {
		that._data(packet);
	});
	this.sock.on('end', function __rpcConnectionOnEnd() {
		logger.info(that.name, 'TCP connection ended by client');
		that.close();
	});
	this.sock.on('error', function __rpcConnectionOnError(error) {
		logger.error(that.name, 'TCP connection error detected:', error);
		that.kill(error);
	});
	this.sock.on('close', function __rpcConnectionOnClose() {
		that.close();
	});
	this.sock.on('timeout', function __rpcConnectionOnTimeout(error) {
		if (error) {
			return that.close(error);
		}
		that.close(new Error('TCP connection timeout'));
	});
	if (heartbeatConf) {
		var checker = function __rpcConnectionHeartbeatChecker() {
			if (!that.connected) {
				return;
			}
			if (that.isTimedout()) {
				if (that.sock) {
					that.sock.emit('timeout', new Error('RPC heartbeat timeout'));
				}
				return;
			}
			setTimeout(checker, heartbeatConf.checkFrequency);
		};
		checker();
	}
}

utils.inherits(Connection, EventEmitter);

Connection.prototype.isTimedout = function () {
	if (Date.now() - this.heartbeatTime >= heartbeatConf.timeout) {
		return true;
	}
	return false;
};

Connection.prototype.useCryptoEngine = function __rpcConnectionUseCryptoEngine(engine) {
	this.crypto = engine;
};

Connection.prototype.close = function __rpcConnectionClose(error) {
	if (this.sock) {
		try {
			this.sock.end();
		} catch (e) {
			logger.error('socket end failed:', e);	
		}
		if (error) {
			logger.error(this.name, 'TCP connection closed by error:', error);
		} else {
			logger.info(this.name, 'TCP connection closed');
		}
	}
	this._clear();
};

Connection.prototype.kill = function __rpcConnectionKill(error) {
	if (this.sock) {
		if (error) {
			logger.error(this.name, 'TCP connection killed from server:', error.message);
		} else {
			logger.info(this.name, 'TCP connection killed from server');
		}
		try {
			this.sock.destroy();
		} catch (e) {
			logger.error('socket destory failed:', e);
		}
	}
	this._clear(true);
};

Connection.prototype._data = function __rpcConnectionDataHandler(packet) {
	var that = this;
	var parsed = this.parser.parse(packet);
	if (parsed instanceof Error) {
		return this.kill(parsed);
	}
	this.heartbeatTime = Date.now();
	var done = function __rpcConnectionDataHandlerDone(error) {
		if (error) {
			return that.kill(error);
		}
	};
	async.eachSeries(parsed, function __rpcConnectionDataHandlerEach(parsedData, next) {
		if (!parsedData) {
			return next();
		}
		that._decrypt(parsedData, next);
	}, done);
};

Connection.prototype._decrypt = function __rpcConnectionDecrypt(parsedData, cb) {
	if (this.crypto && this.crypto.decrypt) {
		var that = this;
		if (!this.sock) {
			return cb(new Error('SocketUnexceptedlyGone'));
		}
		this.crypto.decrypt(
			parsedData.payload,
			gn.session.PROTO.RPC,
			this.sock.remoteAddress,
			this.sock.remotePort,
			function __rpcConnectionOnDecrypt(error, sid, seq, sdata, decrypted) {
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

Connection.prototype._routeAndExec = function __rpcConnectionRouteAndExec(parsedData, sess, cb) {
	var cmd = router.route(this.name, parsedData);
	if (!cmd) {
		return this._errorResponse(parsedData, sess, cb);
	}
	this._execCmd(cmd, parsedData, sess, cb);
};

Connection.prototype._errorResponse = function __rpcConnectionErrorResponse(parsedData, sess, cb) {
	var state = createState(this.id, parsedData, sess);
	var msg = new Buffer('NOT_FOUND');
	if (!this.sock) {
		return cb(new Error('SocketUnexceptedlyGone'));
	}
	state.clientAddress = this.sock.remoteAddress;
	state.clientPort = this.sock.remotePort;
	this._write(new Error('NOT_FOUND'), state, state.STATUS.NOT_FOUND, state.seq, msg, cb);
};

Connection.prototype._execCmd = function __rpcConnectionExecCmd(cmd, parsedData, sess, cb) {
	var that = this;
	var state = createState(this.id, parsedData, sess);
	if (!this.sock) {
		return cb(new Error('SocketUnexceptedlyGone'));
	}
	state.clientAddress = this.sock.remoteAddress;
	state.clientPort = this.sock.remotePort;
	// server push
	state.send = function __rpcConnectionSend(payload) {
		that._push(state, payload);
	};
	// server response (if you need to use this to pretend as a response)
	state.respond = function __rpcConnectionRespond(payload, status, options) {
		var error = null;
		if (payload instanceof Error) {
			payload = payload.message;
			error = payload;
		}
		if (!status) {
			if (error) {
				status = state.STATUS.BAD_REQ;
			} else {
				status = state.STATUS.OK;
			}
		}
		that._write(
			error,
			state,
			status,
			parsedData.seq,
			payload,
			function __rpcConnectionOnWrite() {
			if (options) {
				if (options.closeAfterReply) {
					return that.close();
				}
				if (options.killAfterReply) {
					return that.kill();
				}
			}
		});
	};
	// execute hooks before the handler(s)
	cmd.hooks(state, function __rpcConnectionOnHooks(error, status) {
		if (error) {
			var msg = new Buffer(error.message);
			if (!status) {
				status = transport.STATUS.BAD_REQ;
			}
			return that._write(error, state, status, parsedData.seq, msg, cb);
		}
		var res;
		var options;
		var done = function __rpcConnectionOnCmdDone(error) {
			// respond to client
			that._write(
				error,
				state,
				status,
				parsedData.seq,
				res,
				function __rpcConnectionOnCmdResponse(error) {
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
		async.eachSeries(cmd.handlers, function __rpcConnectionCmdEach(handler, next) {
			handler(state, function __rpcConnectionCmdCallback(_res, _status, _options) {
				options = _options;
				if (_res instanceof Error) {
					if (!_status) {
						_status = transport.STATUS.BAD_REQ;
					}
					status = _status;
					res = new Buffer(_res.message);
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

Connection.prototype._write = function __rpcConnectionWrite(_error, state, status, seq, msg, cb) {
	var that = this;
	if (typeof msg === 'object' && !(msg instanceof Buffer)) {
		msg = JSON.stringify(msg);
	}
	this._encrypt(state, msg, function __rpcConnectionOnWriteEncrypt(error, data) {
		data = transport.createReply(status, seq, data);
		if (error) {
			return that.__write(error, data, cb);
		}
		that.__write(_error, data, cb);
	});
};

Connection.prototype._push = function __rpcConnectionPush(state, msg, cb) {
	var that = this;
	if (typeof msg === 'object' && !(msg instanceof Buffer)) {
		msg = JSON.stringify(msg);
	}
	this._encrypt(state, msg, function __rpcConnectionOnPushEncrypt(error, data) {
		if (error) {
			return cb(error);
		}
		that.__push(transport.createPush(0, data), cb);
	});
};

Connection.prototype.__write = function __rpcConnectionWriteToSock(error, data, cb) {
	
	if (rpc.shutdown()) {
		return cb();
	}

	if (!this.sock || !this.connected) {
		return cb();
	}

	if (error) {
		logger.error(this.name, 'error response:', error, 'size:', data.length, 'bytes');
	}

	try {
		this.sock.write(data, 'UTF-8', cb);
	} catch (e) {
		if (typeof cb === 'function') {
			cb(e);
		} else {
			logger.error('writting to the socket (response) failed:', e);
		}
	}
};

Connection.prototype.__push = function __rpcConnectionPushToSock(data, cb) {
	
	if (rpc.shutdown()) {
		return cb();
	}

	if (!this.sock || !this.connected) {
		if (!cb) {
			return;
		}
		return cb();
	}
	
	try {
		this.sock.write(data, 'UTF-8', cb);
	} catch (e) {
		if (typeof cb === 'function') {
			cb(e);
		} else {
			logger.error('writting to the socket (push) failed:', e);
		}
	}
};

Connection.prototype._encrypt = function __rpcConnectionEncrypt(state, msg, cb) {
	if (this.crypto && this.crypto.encrypt) {
		this.crypto.encrypt(state, msg, function __rpcConnectionOnEncrypt(error, data) {
			if (error) {
				return cb(error);
			}
			cb(null, data);
		});
		return;
	}
	cb(null, msg);
};

Connection.prototype._clear = function __rpcConnectionClear(killed) {
	this.connected = false;
	if (this.sock) {
		this.sock.removeAllListeners();
		this.sock = null;
	}
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
		clientAddress: null,
		clientPort: null,
		sessionId: null,
		seq: null,
		session: null,
		respond: null,
		send: null
	};
	if (sess) {
		state.sessionId = sess.sessionId;
		state.seq = sess.seq;
		state.session = sess.data;
	}
	return state;
}

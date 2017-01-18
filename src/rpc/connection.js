'use strict';

const EventEmitter = require('events').EventEmitter;
const utils = require('util');
const gn = require('../gracenode');
const async = require('../../lib/async');
const transport = require('../../lib/transport');
const rpc = require('./rpc');
// this is not HTTP router
const router = require('./router');
var logger;
var heartbeatConf;

module.exports.setup = function __rpcConnectionSetup() {
	logger = gn.log.create('RPC.connection');
	heartbeatConf = gn.getConfig('rpc.heartbeat');
};

module.exports.create = function __rpcConnectionCreate(sock) {
	return new Connection(sock);
};

function Connection(sock) {
	EventEmitter.call(this);
	const you = sock.remoteAddress + ':' + sock.remotePort;
	var that = this;
	this.sock = sock;
	this.id = gn.lib.uuid.v4().toString();
	this.state = createState(this.id);
	// server push
	this.state.send = function (payload) {
		that._send(payload);
	};
	// server response (if you need to use this to pretend as a response)
	this.state.respond = function (payload, status, options) {
		that._respond(payload, status, options);
	};
	// force disconnect (graceful) connection
	this.state.close = function () {
		that.close();
	};
	// force kill connection
	this.state.kill = function (error) {
		that.kill(error);
	};
	this.parser = new transport.Stream();
	this.crypto = null;
	this.connected = true;
	this.name = '{ID:' + this.id + '|p:' + sock.localPort + '|' + you + '}';
	this.heartbeatTime = Date.now();
	this.sock.on('data', function __rpcConnectionOnData(packet) {
		that._data(packet);
	});
	this.sock.on('end', function __rpcConnectionOnEnd() {
		logger.debug(that.name, 'TCP connection ended by client');
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
		this._checkHeartbeat();
	}
}

utils.inherits(Connection, EventEmitter);


Connection.prototype._send = function __rpcConnectionSend(payload) {
	this._push(payload);
};
// server response (if you need to use this to pretend as a response)
Connection.prototype._respond = function __rpcConnectionRespond(payload, status, options) {
	var error = null;
	if (payload instanceof Error) {
		payload = payload.message;
		error = payload;
	}
	if (!status) {
		if (error) {
			status = this.state.STATUS.BAD_REQ;
		} else {
			status = this.state.STATUS.OK;
		}
	}
	const that = this;
	this._write(
		error,
		status,
		this.state.seq,
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

Connection.prototype._checkHeartbeat = function __rpcConnectionHeartbeatChecker() {
	if (!this.connected) {
		return;
	}
	if (this.isTimedout()) {
		if (this.sock) {
			this.sock.emit('timeout', new Error('RPC heartbeat timeout'));
		}
		return;
	}
	const that = this;
	setTimeout(function () {
		that._checkHeartbeat();
	}, heartbeatConf.checkFrequency);
};

Connection.prototype.isTimedout = function __rpcConnectionIsTimedout() {
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
			logger.debug(this.name, 'TCP connection closed');
		}
	}
	this._clear();
};

Connection.prototype.kill = function __rpcConnectionKill(error) {
	if (this.sock) {
		if (error) {
			logger.error(this.name, 'TCP connection killed from server:', error.message);
		} else {
			logger.debug(this.name, 'TCP connection killed from server');
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
	const that = this;
	const parsed = this.parser.parse(packet);
	if (parsed instanceof Error) {
		return this.kill(parsed);
	}
	this.heartbeatTime = Date.now();
	const done = function __rpcConnectionDataHandlerDone(error) {
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
		const that = this;
		if (!this.sock) {
			return cb(new Error('SocketUnexceptedlyGone'));
		}
		setImmediate(function () {
			that.crypto.decrypt(
				parsedData.payload,
				gn.session.PROTO.RPC,
				that.sock.remoteAddress,
				that.sock.remotePort,
				function __rpcConnectionOnDecrypt(error, sid, seq, sdata, decrypted) {
					if (error) {
						return cb(error);
					}
					const sess = {
						sessionId: sid,
						seq: seq,
						data: sdata
					};
					parsedData.payload = decrypted;
					that._routeAndExec(parsedData, sess, cb);
				}
			);
		});
		return;
	}
	this._routeAndExec(parsedData, null, cb);
};

Connection.prototype._routeAndExec = function __rpcConnectionRouteAndExec(parsedData, sess, cb) {
	const cmd = router.route(this.name, parsedData);
	if (!cmd) {
		return this._errorResponse(parsedData, sess, cb);
	}
	this._execCmd(cmd, parsedData, sess, cb);
};

Connection.prototype._errorResponse = function __rpcConnectionErrorResponse(parsedData, sess, cb) {
	if (!this.sock) {
		return cb(new Error('SocketUnexceptedlyGone'));
	}
	const msg = new Buffer('NOT_FOUND');
	this.state.command = parsedData.command;
	this.state.payload = parsedData.payload;
	this.state.seq = parsedData.seq;
	this.state.clientAddress = this.sock.remoteAddress;
	this.state.clientPort = this.sock.remotePort;
	if (sess) {
		this.state.sessionId = sess.sessionId;
		this.state.seq = sess.seq;
		this.state.session = sess.data;
	}
	this._write(new Error('NOT_FOUND'), this.state.STATUS.NOT_FOUND, this.state.seq, msg, cb);
};

Connection.prototype._execCmd = function __rpcConnectionExecCmd(cmd, parsedData, sess, cb) {
	if (!this.sock) {
		return cb(new Error('SocketUnexceptedlyGone'));
	}
	const that = this;
	this.state.command = parsedData.command;
	this.state.payload = parsedData.payload;
	this.state.seq = parsedData.seq;
	this.state.clientAddress = this.sock.remoteAddress;
	this.state.clientPort = this.sock.remotePort;
	if (sess) {
		this.state.sessionId = sess.sessionId;
		this.state.seq = sess.seq;
		this.state.session = sess.data;
	}
	// execute hooks before the handler(s)
	cmd.hooks(this.state, function __rpcConnectionOnHooks(error, status) {
		if (error) {
			const msg = new Buffer(error.message);
			if (!status) {
				status = transport.STATUS.BAD_REQ;
			}
			return that._write(error, status, parsedData.seq, msg, cb);
		}
		var res;
		var options;
		const done = function __rpcConnectionOnCmdDone(error) {
			// respond to client
			that._write(
				error,
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
				}
			);
		};
		async.eachSeries(cmd.handlers, function __rpcConnectionCmdEach(handler, next) {
			handler(that.state, function __rpcConnectionCmdCallback(_res, _status, _options) {
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

Connection.prototype._write = function __rpcConnectionWrite(_error, status, seq, msg, cb) {
	const that = this;
	if (typeof msg === 'object' && !(msg instanceof Buffer)) {
		msg = JSON.stringify(msg);
	}
	this._encrypt(msg, function __rpcConnectionOnWriteEncrypt(error, data) {
		data = transport.createReply(status, seq, data);
		if (error) {
			return that.__write(error, data, cb);
		}
		that.__write(_error, data, cb);
	});
};

Connection.prototype._push = function __rpcConnectionPush(msg, cb) {
	const that = this;
	if (typeof msg === 'object' && !(msg instanceof Buffer)) {
		msg = JSON.stringify(msg);
	}
	this._encrypt(msg, function __rpcConnectionOnPushEncrypt(error, data) {
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
		this.sock.write(data, 'binary', cb);
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
		this.sock.write(data, 'binary', cb);
	} catch (e) {
		if (typeof cb === 'function') {
			cb(e);
		} else {
			logger.error('writting to the socket (push) failed:', e);
		}
	}
};

Connection.prototype._encrypt = function __rpcConnectionEncrypt(msg, cb) {
	if (this.crypto && this.crypto.encrypt) {
		const that = this;
		setImmediate(function () {
			that.crypto.encrypt(that.state, msg, function __rpcConnectionOnEncrypt(error, data) {
				if (error) {
					return cb(error);
				}
				cb(null, data);
			});
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
	this.emit('clear', killed);
};

function createState(id) {
	const state = {
		STATUS: transport.STATUS,
		command: 0,
		payload: null,
		connId: id,
		clientAddress: null,
		clientPort: null,
		sessionId: null,
		seq: 0,
		session: null,
		respond: null,
		send: null,
		push: null,
		close: null,
		kill: null
	};
	return state;
}

'use strict';

const EventEmitter = require('events').EventEmitter;
const utils = require('util');
const gn = require('../gracenode');
const async = require('../../lib/async');
const transport = require('../../lib/transport');
const rpc = require('./rpc');
// this is not HTTP router
const router = require('./router');

const PING_MSG = gn.Buffer.alloc('ping');
const PONG_MSG = gn.Buffer.alloc('PONG\n');

var logger;
var heartbeatConf;
var cryptoEngine;
var callbackTimeout = 0;

module.exports.setup = function __rpcConnectionSetup() {
	logger = gn.log.create('RPC.connection');
	heartbeatConf = gn.getConfig('rpc.heartbeat');
};

module.exports.requireCallback = function __rpcConnectionReqCb(timeout) {
	callbackTimeout = timeout;
};

module.exports.useCryptoEngine = function __rpcConnectionUseCryptoEngine(_cryptoEngine) {
	cryptoEngine = _cryptoEngine;
};

module.exports.create = function __rpcConnectionCreate(sock) {
	return new Connection(sock);
};

function Connection(sock) {
	EventEmitter.call(this);
	var you = sock.remoteAddress + ':' + sock.remotePort;
	// object to hold response data/options/status/timeout/skipped
	this.response = {
		data: null,
		options: null,
		timeout: null,
		skipped: false,
		status: transport.STATUS.OK
	};
	this.sock = sock;
	this.id = gn.lib.uuid.v4().toString();
	this.state = createState(this.id);
	// server push
	var params = { that: this };
	this.state.send = _send.bind(null, params);
	// server response (if you need to use this to pretend as a response)
	this.state.respond = _respond.bind(null, params); 
	// force disconnect (graceful) connection
	this.state.close = _close.bind(null, params);
	// force kill connection
	this.state.kill = _kill.bind(null, params);

	this.parser = new transport.Stream();
	this.connected = true;
	this.name = '{ID:' + this.id + '|p:' + sock.localPort + '|' + you + '}';
	this.sock.on('data', _onDataReceived.bind(null, params));
	this.sock.on('end', _onConnectionEnd.bind(null, params));
	this.sock.on('error', _onConnectionError.bind(null, params));
	this.sock.on('close', _onConnectionClose.bind(null, params));
	this.sock.on('timeout', _onConnectionTimeout.bind(null, params));

	if (heartbeatConf) {
		this._checkHeartbeat();
	}
}

function _send(bind, payload) {
	bind.that._send(payload);
}

function _respond(bind, payload, status, options) {
	bind.that._respond(payload, status, options);
}

function _close(bind) {
	bind.that.close();
}

function _kill(bind, error) {
	bind.that.kill(error);
} 

function _onDataReceived(bind, packet) {
	bind.that.state.now = gn.lib.now();
	bind.that._data(packet);
}

function _onConnectionEnd(bind) {
	logger.sys(bind.that.name, 'TCP connection ended by client');
	bind.that.kill(new Error('TCP disconnected by client'));
}

function _onConnectionError(bind, error) {
	logger.error(bind.that.name, 'TCP connection error detected:', error);
	bind.that.kill(error);
}

function _onConnectionClose(bind) {
	bind.that.close();
}

function _onConnectionTimeout(bind, error) {
	if (error) {
		return bind.that.close(error);
	}
	bind.that.close(new Error('TCP connection timeout'));
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
	var params = {
		that: this,
		options: options
	};
	this._write(
		error,
		status,
		this.state.seq,
		payload,
		_onRespond.bind(params)
	);
};

function _onRespond() {
	var that = this.that;
	var options = this.options;
	if (options) {
		if (options.closeAfterReply) {
			return that.close();
		}
		if (options.killAfterReply) {
			return that.kill();
		}
	}
}

Connection.prototype._checkHeartbeat = function __rpcConnectionHeartbeatChecker() {
	try {
		if (!this.connected) {
			if (this.sock) {
				this.sock.emit('error', new Error('RPC connection lost'));
			} else {
				this.emit('clear', true, this.id);
			}
			return;
		}
		if (this.isTimedout()) {
			if (this.sock) {
				this.sock.emit('timeout', new Error('RPC heartbeat timeout'));
			} else {
				this.emit('clear', true, this.id);
			}
			return;
		}
	} catch (error) {
		logger.error(this.name, 'TCP heartbeat error:', error);		
	}
	setTimeout(_callHeartbeatCheck.bind({ that: this }), heartbeatConf.checkFrequency);
};

function _callHeartbeatCheck() {
	this.that._checkHeartbeat();
}

Connection.prototype.isTimedout = function __rpcConnectionIsTimedout() {
	if (gn.lib.now() - this.state.now >= heartbeatConf.timeout) {
		return true;
	}
	return false;
};

Connection.prototype.close = function __rpcConnectionClose(error) {
	if (this.sock) {
		try {
			if (error) {
				logger.sys(this.name, 'TCP connection closed by error:', error);
				// force close (closed)
				this.sock.destroy();
			} else {
				logger.sys(this.name, 'TCP connection closed');
				// send FIN packet (half-closed)
				this.sock.end();
			}
		} catch (e) {
			logger.error(this.name, 'TCP socket end failed:', e);	
		}
	}
	this._clear();
};

Connection.prototype.kill = function __rpcConnectionKill(error) {
	if (this.sock) {
		if (error) {
			logger.sys(this.name, 'TCP connection killed from server:', error);
		} else {
			logger.sys(this.name, 'TCP connection killed from server');
		}
		try {
			this.sock.destroy();
		} catch (e) {
			logger.error(this.name, 'TCP socket destory failed:', e);
		}
	}
	this._clear(true);
};

Connection.prototype._data = function __rpcConnectionDataHandler(packet) {
	if (this._handleIfPing(packet)) {
		return;
	}
	var parsed = this.parser.parse(packet);
	if (parsed instanceof Error) {
		return this.kill(parsed);
	}
	var params = { that: this };
	async.loopSeries(
		parsed,
		params,
		_onEachData,
		_onDataHandled.bind(null, params)
	);
};

Connection.prototype._handleIfPing = function __rpcConnectionHandleIfPing(packet) {
	if (packet[0] === PING_MSG[0] &&
		packet[1] === PING_MSG[1] &&
		packet[2] === PING_MSG[2] &&
		packet[3] === PING_MSG[3]
	) {
		this.__write(null, PONG_MSG, _onHandlePing.bind(null, { that: this }));
		return true;
	}
	return false;
};

function _onHandlePing(bind) {
	bind.that.close();
}

function _onDataHandled(bind, error) {
	if (error) {
		return bind.that.kill(error);
	}
}

function _onEachData(parsedData, params, next) {
	if (!parsedData) {
		return next();
	}
	params.that._decrypt(parsedData, next);
}

Connection.prototype._decrypt = function __rpcConnectionDecrypt(parsedData, cb) {
	// handle command routing
	var cmd = router.route(this.name, parsedData);
	// execute command w/ encryption and decryption
	if (cryptoEngine && cryptoEngine.decrypt) {
		if (!this.sock) {
			return cb(new Error('SocketUnexceptedlyGone'));
		}
		var that = this;
		var params = {
			that: that,
			parsedData: parsedData,
			cmd: cmd,
			cb: cb
		};
		cryptoEngine.decrypt(
			parsedData.payload,
			gn.session.PROTO.RPC,
			this.sock.remoteAddress,
			this.sock.remotePort,
			_onDecrypt.bind(null, params)
		);
		return;
	}
	// execute command w/o encryption + decryption
	if (!cmd) {
		return this._errorResponse(parsedData, null, cb);
	}
	this._execCmd(cmd, parsedData, null, cb);
};

function _onDecrypt(bind, error, sid, seq, sdata, decrypted) {
	if (error) {
		return bind.cb(error);
	}
	var sess = {
		sessionId: sid,
		seq: seq,
		data: sdata
	};
	bind.parsedData.payload = decrypted;
	if (!bind.cmd) {
		return bind.that._errorResponse(bind.parsedData, sess, bind.cb);
	}
	bind.that._execCmd(bind.cmd, bind.parsedData, sess, bind.cb);
}

Connection.prototype._errorResponse = function __rpcConnectionErrorResponse(parsedData, sess, cb) {
	if (!this.sock) {
		return cb(new Error('SocketUnexceptedlyGone'));
	}
	var msg = gn.Buffer.alloc('NOT_FOUND');
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
	var params = {
		that: this,
		cmd: cmd,
		parsedData: parsedData,
		cb: cb
	};
	cmd.hooks(parsedData, this.state, _onHooksFinished.bind(null, params));
};

function _onHooksFinished(bind, error, status) {
	var that = bind.that;
	var cmd = bind.cmd;
	var parsedData = bind.parsedData;
	var cb = bind.cb;
	var params = {
		that: that,
		cmd: cmd,
		parsedData: parsedData,
		cb: cb
	};
	if (error) {
		var msg = gn.Buffer.alloc(error.message);
		if (!status) {
			status = transport.STATUS.BAD_REQ;
		}
		return that._write(error, status, parsedData.seq, msg, cb);
	}
	that.response.data = null;
	that.response.options = null;
	that.response.timeout = null;
	that.response.skipped = false;
	that.response.status = status || transport.STATUS.OK;
	async.eachSeries(
		cmd.handlers,
		_onEachCommand.bind(null, params),
		_onCommandsFinished.bind(null, params)
	);
}

function _onEachCommand(bind, handler, next) {
	var that = bind.that;
	var cmd = bind.cmd;
	var params = {
		that: that,
		cmd: cmd,
		next: next
	};
	if (callbackTimeout) {
		that.response.timeout = setTimeout(
			_onResponseTimeout.bind(null, params),
			callbackTimeout
		);
	}
	handler(that.state, _onCommand.bind(null, params));
}

function _onResponseTimeout(bind) {
	var that = bind.that;
	var cmd = bind.cmd;
	var next = bind.next;
	logger.error(
		that.name,
		'command', cmd.id, cmd.name,
		'callback is required but not called in',
		callbackTimeout + 'ms',
		'respond as an error with status',
		transport.STATUS.SERVER_ERR
	);
	that.response.skipped = true;
	that.response.status = transport.STATUS.SERVER_ERR;
	that.response.data = gn.Buffer.alloc('MISSING_CALLBACK');
	next();
}

function _onCommand(bind, _res, _status, _options) {
	var that = bind.that;
	var next = bind.next;
	if (that.response.timeout) {
		clearTimeout(that.response.timeout);
		that.response.timeout = null;
	}
	if (that.response.skipped) {
		// timeout has been called: skip
		return;
	}
	that.response.options = _options;
	if (_res instanceof Error) {
		if (!_status) {
			_status = transport.STATUS.BAD_REQ;
		}
		that.response.status = _status;
		that.response.data = gn.Buffer.alloc(_res.message);
		return next(_res);
	}
	if (!_status) {
		_status = transport.STATUS.OK;
	}
	that.response.status = _status;
	that.response.data = _res;
	next();
}

function _onCommandsFinished(bind, error) {
	var that = bind.that;
	var parsedData = bind.parsedData;
	var cb = bind.cb;
	var params = {
		that: that,
		cb: cb
	};
	// respond to client
	if (!that.response.data) {
		throw new Error('MissingResponsePacket');
	}
	that._write(
		error,
		that.response.status,
		parsedData.seq,
		that.response.data,
		_onCommandResponseFinished.bind(null, params)
	);
}

function _onCommandResponseFinished(bind, error) {
	var that = bind.that;
	var cb = bind.cb;
	if (that.response.options) {
		if (that.response.options.closeAfterReply) {
			return that.close();
		}
		if (that.response.options.killAfterReply) {
			return that.kill();
		}
	}
	cb(error);
}

Connection.prototype._write = function __rpcConnectionWrite(_error, status, seq, msg, cb) {
	if (typeof msg === 'object' && !(msg instanceof Buffer)) {
		msg = JSON.stringify(msg);
	}
	var params = {
		that: this,
		_error: _error,
		status: status,
		seq: seq,
		cb: cb
	};
	this._encrypt(msg, _onWriteEncrypt.bind(null, params));
};

function _onWriteEncrypt(bind, error, data) {
	var that = bind.that;
	var _error = bind._error;
	var status = bind.status;
	var seq = bind.seq;
	var cb = bind.cb;
	data = transport.createReply(status, seq, data);
	if (error) {
		return that.__write(error, data, cb);
	}
	that.__write(_error, data, cb);
}

Connection.prototype._push = function __rpcConnectionPush(msg, cb) {
	if (typeof msg === 'object' && !(msg instanceof Buffer)) {
		msg = JSON.stringify(msg);
	}
	this._encrypt(msg, _onPushEncrypt.bind(null, { that: this, cb: cb }));
};

function _onPushEncrypt(bind, error, data) {
	if (error) {
		return bind.cb(error);
	}
	bind.that.__push(transport.createPush(0, data), bind.cb);
}

Connection.prototype.__write = function __rpcConnectionWriteToSock(error, data, cb) {
	
	if (rpc.shutdown()) {
		return cb();
	}

	if (!this.sock || !this.connected) {
		return cb();
	}

	if (error) {
		logger.sys(this.name, 'error response:', error, 'size:', data.length, 'bytes');
	}

	try {
		this.sock.write(data, 'binary');
	} catch (e) {
		logger.error(this.name, 'write to the TCP socket (response) failed:', e);
	}
	if (typeof cb === 'function') {
		cb();
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
		this.sock.write(data, 'binary');
	} catch (e) {
		logger.error(this.name, 'write to the TCP socket (push) failed:', e);
	}
};

Connection.prototype._encrypt = function __rpcConnectionEncrypt(msg, cb) {
	if (!this.connected) {
		return;
	}
	if (cryptoEngine && cryptoEngine.encrypt) {
		cryptoEngine.encrypt(this.state, msg, _onEncrypt.bind(null, { cb: cb }));
		return;
	}
	cb(null, msg);
};

function _onEncrypt(bind, error, data) {
	if (error) {
		return bind.cb(error);
	}
	bind.cb(null, data);
}

Connection.prototype._clear = function __rpcConnectionClear(killed) {
	this.connected = false;
	if (this.sock) {
		this.sock.removeAllListeners();
		try {
			this.sock.destroy();
		} catch (err) {
			logger.error('Clearing socket object error:', err);
		}
	}
	if (this.parser) {
		delete this.parser.buffer;
	}
	delete this.state;
	delete this.sock;
	delete this.parser;
	this.emit('clear', killed, this.id);
	this.removeAllListeners();
};

function createState(id) {
	return {
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
		kill: null,
		now: gn.lib.now()
	};
}

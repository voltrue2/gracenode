'use strict';

var async = require('../../lib/async');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var gn = require('../gracenode');
var transport = require('../../lib/transport');
// this is not HTTP router
var router = require('./router');
var logger = gn.log.create('RPC.connection');

module.exports = Connection;

function Connection(connId, sock, options) {
	EventEmitter.call(this);
	// this.data is accessible from command controller functions
	// can also be used to identify the connection from outside
	this.parser = new transport.Stream();
	var that = this;
	this.connected = true;
	this.cryptoEngine = options.cryptoEngine || null;
	this.data = {};
	this.id = connId;
	this.sock = sock;
	this.heartbeatTime = 0;
	this.self = (this.sock) ? this.sock.localAddress + ':' + this.sock.localPort : 'UNKNOWN';
	this.from = (this.sock) ? this.sock.remoteAddress + ':' + this.sock.remotePort : 'UNKNOWN';
	this.name = '{' + 'RPC.CID:' + connId + '|server=' + this.self + '|client=' + this.from + '}';

	// RPC events
	this.sock.on('data', function (packet) {
		that._handleData(packet);
	});
	this.sock.on('end', function () {
		that._handleEnd();
	});
	this.sock.on('error', function (error) {
		that._handleError(error);
	});
	this.sock.on('close', function () {
		that.close();
	});
	this.sock.on('timeout', function () {
		logger.error(that.name, 'TCP connection timed out');
		that.close();
	});

	// if heartbeat is required, set it up here now
	if (gn.getConfig('rpc.heartbeat')) {
		/*
		rpc.heartbeat: {
			timeout: [milliseconds] // time to timeout and disconnect w/o heartbeat from client,
			checkFrequency: [milliseconds] // heartbeat check internval
		}
		*/
		that._setupHeartbeat(gn.getConfig('rpc.heartbeat'));
		logger.info(
			this.name,
			'RPC server requires client heartbeat at every',
			gn.getConfig('rpc.heartbeat').timeout, 'msec'
		);
	}

	logger.info(this.name, 'RPC connection ready: (connection ID:' + this.id + ')');
}

util.inherits(Connection, EventEmitter);

Connection.prototype.useCryptoEngine = function (engine) {
	this.cryptoEngine = engine;
};

// public
Connection.prototype.close = function () {
	
	logger.info(this.name, 'RPC connection close');

	if (!this.sock) {
		logger.warn(this.name, 'RPC socket has already been gone:');
		return;
	}

	// this will invoke 'end event'
	this.connected = false;
	this.sock.end();
	this.emit('close');
};

// public
Connection.prototype.kill = function (error) {
	if (error) {
		logger.error(this.name, 'RPC connection kill', error);
	}
	if (!this.sock) {
		logger.warn(this.name, 'RPC socket has already been gone before .kill');
		return;
	}
	// this is a hard kill connection
	this.connected = false;
	this.sock.destroy();
	this.sock = null;
	this.emit('kill');
};

// private
Connection.prototype._handleData = function (packet) {
	logger.verbose(this.name, 'packet received');

	var parsed = this.parser.parse(packet);

	if (parsed instanceof Error) {
		return this.kill(parsed);
	}

	var that = this;
	var done = function (error) {
		if (error) {
			return that.kill(error);		
		}
		var list = parsed.map(function (item) {
			if (!item) {
				return '';
			}
			return item.command;
		});
		logger.info(that.name, 'all incoming commands handled:', list.join(','));
	};

	// route to commands and execute each command handler
	async.eachSeries(parsed, function (parsedData, next) {
	
		if (!parsedData) {
			return next();
		}
	
		if (!that.cryptoEngine.decrypt) {
			return that._routeAndExec(parsedData, null, next);
		}
		logger.info(that.name, 'using decryption for incoming packet');
		that._handleDecrypt(parsedData.payload, function (error, sid, seq, sdata, decrypted) {
			if (error) {
				return next(error);
			}
			var sessionData = {
				sessionId: sid,
				seq: seq,
				data: sdata
			};
			parsedData.payload = decrypted;
			that._routeAndExec(parsedData, sessionData, next);
		});
	}, done);
};

// private called from ._handleData()
Connection.prototype._routeAndExec = function (parsedData, sessionData, next) {
	var cmd = router.route(parsedData);
	
	if (!cmd) {
		var state = {
			command: parsedData.command,
			connection: this
		};
		if (sessionData) {
			state.sessionId = sessionData.sessionId;
			state.seq = sessionData.seq;
			state.session = sessionData.data;
		}
		var that = this;
		var err = { message: 'NOT_FOUND' };
		this._prepareWrite(state, err, function (error, data) {
			if (error) {
				return next(error);
			}
			var notFound = transport.createReply(
				transport.STATUS.NOT_FOUND,
				state.seq,
				data
			);
			if (notFound instanceof Error) {
				return next(notFound);
			}
			that._write(notFound);
			next();
		});
		return;
	}

	logger.info(
		this.name,
		'command routing resolved:',
		'command:', cmd.id, cmd.name,
		'(seq:' + parsedData.seq + ')'
	);
	
	executeCmd(this, cmd, parsedData, sessionData, next);	
};

// private
Connection.prototype._write = function (data, notError, cb) {
	if (this.sock) {
		this.sock.write(data, 'UTF-8', cb);
		if (notError) {
			logger.info(this.name, 'command response sent:', 'size:', data.length + ' bytes');
		} else {
			logger.error(this.name, 'error command response sent:', 'size:', data.length + ' bytes');
		}
		return;
	}
	logger.warn(this.name, 'TCP socket is gone');
};

// private/public: this will be called from command handlers 
Connection.prototype._push = function (state, payload, cb) {
	var that = this;
	this._prepareWrite(state, payload, function (error, data) {
		if (error) {
			return cb(error);
		}
		logger.info(that.name, 'push from server:', payload);
		var pushPacket = transport.createPush(0, data);
		that._write(pushPacket, true, cb);
	});
};

// private
Connection.prototype._prepareWrite = function (state, payload, cb) {

	if (this.cryptoEngine.encrypt) {
		logger.info(this.name, 'using encryption for secure transmission:', payload);
		if (typeof payload === 'object' && !(payload instanceof Buffer)) {
			payload = JSON.stringify(payload);
		}
		var that = this;
		this.cryptoEngine.encrypt(state, payload, function (error, encrypted) {
			if (error) {
				logger.error(that.name, 'encryption failed:', payload);
				return cb(error);
			}
			cb(null, encrypted);
		});
		return;
	}
	
	// no encryption
	cb(null, payload);
};

// private
Connection.prototype._handleEnd = function () {
	logger.info(this.name, 'TCP connection ended by client');
	// this event is followed by close event
	// Connection class will catch close event and call this.close()
};

// private
Connection.prototype._handleError = function (error) {
	logger.error(this.name, 'TCP connection error detected:', error);
	// this event is followed by close event
	// Connection class will catch close event and call this.close()
};

// private
Connection.prototype._handleDecrypt = function (data, cb) {
	this.cryptoEngine.decrypt(
		data,
		gn.session.PROTO.RPC,
		this.sock.remoteAddress,
		this.sock.remotePort,
		cb
	);
};

// private
Connection.prototype._setupHeartbeat = function (heartbeat) {
	var that = this;
	var checker = function () {
		setTimeout(function () {
			if (!that.connected) {
				logger.verbose(that.name, 'heartbeat check has stopped b/c connection has been lost');
				return;
			}
			var now = Date.now();
			logger.verbose(
				that.name,
				'heartbeat check > now and last heartbeat:',
				now, that.heartbeatTime
			);
			if (now - that.heartbeatTime >= heartbeat.timeout) {
				logger.error(that.name, 'heartbeat timeout and disconnecting');
				that.close();
				that.emit('heartbeatTimeout');
				return;
			}
			checker();
		}, heartbeat.checkFrequency);
	};
	checker();
};

function executeCmd(that, cmd, parsedData, sessionData, cb) {
	var write = function (_error, res, cmd, status, options, cb) {

		if (_error || status > 1) {
			logger.error(
				that.name,
				'command response as error:',
				cmd.id, cmd.name, _error,
				'(seq:' + parsedData.seq + ')',
				'(status:' + status + ')'
			);
			if (_error && _error.message) {
				res = { message: _error.message };
			}
		} else {
			logger.info(
				that.name,
				'command response:',
				cmd.id, cmd.name, res,
				'(seq:' + parsedData.seq + ')',
				'(status:' + status + ')'
			);
		}

		if (typeof res !== 'object' || res === null) {
			res = {
				message: res
			};
		}

		that._prepareWrite(state, res, function (error, data) {
			if (error) {
				logger.error(that.name, error);
				if (typeof cb === 'function') {
					return cb(error);
				}
				return;
			}
			var replyPacket = transport.createReply(
				status,
				parsedData.seq,
				data
			);
			if (replyPacket instanceof Error) {
				logger.error(that.name, replyPacket);
				if (typeof cb === 'function') {
					return cb(error);
				}
				return;
			}
			that._write(replyPacket, true);

			// check options
			if (options) {
				if (options.closeAfterReply) {
					return that.close();
				}
				if (options.killAfterReply) {
					return that.kill();
				}
			}
			if (typeof cb === 'function') {
				cb();
			}
		});
	};
	var state = {
		STATUS: transport.STATUS,
		set: function (key, val) {
			that.data[key] = val;
		},
		get: function (key) {
			return (that.data.hasOwnProperty(key)) ? that.data[key] : null;
		},
		send: function (payload, cb) {
			that._push.apply(that, [state, payload, cb]);
		},
		command: cmd.id,
		connection: that,
		payload: parsedData.payload
	};

	if (sessionData) {
		state.sessionId = sessionData.sessionId;
		state.seq = sessionData.seq;
		state.session = sessionData.data;
	}

	// execute command hooks
	cmd.hooks(state, function (error, status) {
		if (error) {
			if (!status) {
				status = transport.STATUS.BAD_REQ;
			}
			var msg = {
				message: error.message,
				code: status
			};
			write(error, msg, cmd, status, cb);
			return;
		}
		var res;
		var options;
		var finalize = function (error) {
			if (error) {
				return write(error, error, cmd, status, options, cb);
			}
			write(null, res, cmd, status, options, cb);
		};
		async.eachSeries(cmd.handlers, function (handler, next) {
			logger.verbose(that.name, 'execute command handler (command:' + cmd.id + ')');	
			handler(state, function (_res, _status, _options) {
				var error = null;
				if (_res instanceof Error) {
					error = _res;
					if (!_status) {
						// default error response status
						_status = transport.STATUS.BAD_REQ;
					}
					status = _status;
					options = _options;
					return next(error);
				}
				if (!_status) {
					// default response status
					_status = transport.STATUS.OK;
				}
				res = _res;
				status = _status;
				options = _options;
				next();		
			});
		}, finalize);
	});
}

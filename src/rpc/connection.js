'use strict';

var async = require('../../lib/async');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var gn = require('../gracenode');
var Packet = require('../../lib/packet');
var transport = require('../../lib/transport');
// this is not HTTP router
var router = require('./router');

module.exports = Connection;

function Connection(connId, sock, options) {
	EventEmitter.call(this);
	// this.data is accessible from command controller functions
	// can also be used to identify the connection from outside
	this.cryptoEngine = options.cryptoEngine || null;
	this.data = {};
	this.id = connId;
	this.sock = sock;
	this.heartbeatTime = 0;
	this.self = (this.sock) ? this.sock.localAddress + ':' + this.sock.localPort : 'UNKNOWN';
	this.from = (this.sock) ? this.sock.remoteAddress + ':' + this.sock.remotePort : 'UNKNOWN';
	this.logger = gn.log.create(
		'RPC.connection ID:' + connId + '][server=' + this.self + ' client=' + this.from
	);

	this.packetParser = new Packet(gn.log.create('RPC.packetParser'));

	var that = this;

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
		that.logger.error('TCP connection timed out');
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
		this.logger.info(
			'RPC server requires client heartbeat at every',
			gn.getConfig('rpc.heartbeat').timeout, 'msec'
		);
	}

	this.logger.info('RPC connection ready: (connection ID:' + this.id + ')');
}

util.inherits(Connection, EventEmitter);

Connection.prototype.useCryptoEngine = function (engine) {
	this.cryptoEngine = engine;
};

// public
Connection.prototype.close = function () {
	
	this.logger.info('RPC connection close');

	if (!this.sock) {
		this.logger.warn('RPC socket has already been gone:');
		return;
	}

	// this will invoke 'end event'
	this.sock.end();
	this.emit('close');
};

// public
Connection.prototype.kill = function (error) {
	if (error) {
		this.logger.error('RPC connection kill', error);
	}
	if (!this.sock) {
		this.logger.warn('RPC socket has already been gone before .kill');
		return;
	}
	// this is a hard kill connection
	this.sock.destroy();
	this.sock = null;
	this.emit('kill');
};

// private
Connection.prototype._handleData = function (packet) {
	this.logger.verbose('packet received');

	var parsed = this.packetParser.parse(packet);

	if (parsed instanceof Error) {
		return this.kill(parsed);
	}

	var that = this;
	var parser = that.packetParser;
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
		that.logger.info('all incoming commands handled:', list.join(','));
	};

	// route to commands and execute each command handler
	async.eachSeries(parsed, function (parsedData, next) {
	
		if (!parsedData) {
			return next();
		}
	
		if (!that.cryptoEngine.decrypt) {
			return that._routeAndExec(parser, parsedData, null, next);
		}
		that.logger.info('using decryption for incoming packet');
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
			that._routeAndExec(parser, parsedData, sessionData, next);
		});
	}, done);
};

// private called from ._handleData()
Connection.prototype._routeAndExec = function (parser, parsedData, sessionData, next) {
	var cmd = router.route(parsedData);
	
	if (!cmd) {
		var state = {
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
			var notFound = parser.createReply(
				parser.STATUS_CODE.NOT_FOUND,
				parsedData.seq,
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

	this.logger.info(
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
			this.logger.info('command response sent:', 'size:', data.length + ' bytes');
		} else {
			this.logger.error('error command response sent:', 'size:', data.length + ' bytes');
		}
		return;
	}
	this.logger.warn('TCP socket is gone');
};

// private/public: this will be called from command handlers 
Connection.prototype._push = function (state, payload, cb) {
	var that = this;
	this._prepareWrite(state, payload, function (error, data) {
		if (error) {
			return cb(error);
		}
		that.logger.info('push from server:', payload);
		var pushPacket = that.packetParser.createPush(data);
		that._write(pushPacket, true, cb);
	});
};

// private
Connection.prototype._prepareWrite = function (state, payload, cb) {

	if (this.cryptoEngine.encrypt) {
		this.logger.info('using encryption for secure transmission:', payload);
		if (typeof payload === 'object' && !(payload instanceof Buffer)) {
			payload = JSON.stringify(payload);
		}
		var that = this;
		this.cryptoEngine.encrypt(state, payload, function (error, encrypted) {
			if (error) {
				that.logger.error('encryption failed:', payload);
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
	this.logger.info('TCP connection ended by client');
	// this event is followed by close event
	// Connection class will catch close event and call this.close()
};

// private
Connection.prototype._handleError = function (error) {
	this.logger.error('TCP connection error detected:', error);
	// this event is followed by close event
	// Connection class will catch close event and call this.close()
};

// private
Connection.prototype._handleDecrypt = function (data, cb) {
	this.cryptoEngine.decrypt(
		data,
		'RPC',
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
			var now = Date.now();
			that.logger.verbose(
				'heartbeat check > now and last heartbeat:',
				now, that.heartbeatTime
			);
			if (now - that.heartbeatTime >= heartbeat.timeout) {
				that.logger.error('heartbeat timeout and disconnecting');
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
	var parser = that.packetParser; 
	var write = function (error, res, cmd, status, options, cb) {

		if (error) {
			that.logger.error(
				'command response as error:',
				cmd.id, cmd.name, error.message,
				'(seq:' + parsedData.seq + ')',
				'(status:' + status + ')'
			);
			res = {
				message: error.message
			};
		}

		if (typeof res !== 'object' || res === null) {
			res = {
				message: res
			};
		}
	
		// response status
		res.code = status;

		that._prepareWrite(state, res, function (error, data) {
			if (error) {
				that.logger.error(error);
				if (typeof cb === 'function') {
					return cb(error);
				}
				return;
			}
			that.logger.info(
				'command response:',
				cmd.id, cmd.name, res,
				'(seq:' + parsedData.seq + ')',
				'(status:' + status + ')'
			);
			var replyPacket = parser.createReply(
				parser.status(res),
				parsedData.seq,
				data
			);
			if (replyPacket instanceof Error) {
				that.logger.error(replyPacket);
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
		connection: that,
		payload: JSON.parse(parsedData.payload)
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
				status = parser.STATUS_CODE.BAD_REQ;
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
			that.logger.verbose('execute command handler (command:' + cmd.id + ')');	
			handler(state, function (_res, _status, _options) {
				var error = null;
				if (_res instanceof Error) {
					error = _res;
					if (!_status) {
						// default error response status
						_status = parser.STATUS_CODE.BAD_REQ;
					}
					status = _status;
					options = _options;
					return next(error);
				}
				if (!status) {
					// default response status
					_status = parser.STATUS_CODE.OK;
				}
				res = _res;
				status = _status;
				options = _options;
				next();		
			});
		}, finalize);
	});
}

'use strict';

var async = require('async');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var gn = require('../gracenode');
var Packet = require('../../lib/packet');
// this is not HTTP router
var router = require('./router');

module.exports = Connection;

function Connection(connId, sock, options) {
	EventEmitter.call(this);
	// this.data is accessible from command controller functions
	// can also be used to identify the connection from outside
	this.cryptoEngine = options.cryptoEngine || null;
	this.data = {};
	this.connId = connId;
	this.sock = sock;
	this.self = (this.sock) ? this.sock.localAddress + ':' + this.sock.localPort : 'UNKNOWN';
	this.from = (this.sock) ? this.sock.remoteAddress + ':' + this.sock.remotePort : 'UNKNOWN';
	this.logger = gn.log.create(
		'RPC.connection(ID:' + connId + ')<local:' + this.self + '><remote:' + this.from + '>'
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

	this.logger.info('RPC connection ready: (connection ID:' + this.connId + ')');
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

	var parsed = this.packetParser.parse(packet, this.cryptoEngine);

	if (parsed instanceof Error) {
		return this.kill(parsed);
	}

	var that = this;
	var parser = that.packetParser;
	var done = function () {
		var list = parsed.map(function (item) {
			return item.command;
		});
		that.logger.info('all incoming commands handled:', list.join(','));
	};
	var routeAndExec = function (parsedData, sessionData, next) {
		var cmd = router.route(parsedData);
		
		if (!cmd) {
			var state = {};
			if (sessionData) {
				state.sessionId = sessionData.sessionId;
				state.seq = sessionData.seq;
				state.session = sessionData.data;
			}
			var err = { message: 'NOT_FOUND' };
			that._prepareWrite(state, err, function (error, data) {
				if (error) {
					return next(error);
				}
				var notFound = parser.createReply(
					parser.STATUS_CODE.NOT_FOUND,
					parsedData.seq,
					data
				);
				that._write(notFound);
				next();
			});
			return;
		}

		that.logger.info(
			'command routing resolved:',
			'command:', cmd.id, cmd.name,
			'seq:', parsedData.seq
		);
		
		executeCmd(that, cmd, parsedData, sessionData, next);	
	};

	// route to commands and execute each command handler
	async.eachSeries(parsed, function (parsedData, next) {
		
		if (that.cryptoEngine.decrypt) {
			that.logger.info('using decryption for incoming packet');
			that._handleDecrypt(parsedData.payload, function (error, sid, seq, sdata, decrypted) {
				if (error) {
					that.logger.error('failed to decrypt:', error);
					var forbidden = parser.createReply(
						parser.STATUS_CODE.FORBIDDEN, parsedData.seq,
						''
					);
					that._write(forbidden);
					return next();
				}
				var sessionData = {
					sessionId: sid,
					seq: seq,
					data: sdata
				};
				parsedData.payload = decrypted;
				routeAndExec(parsedData, sessionData, next);
			});
			return;
		}
		
		routeAndExec(parsedData, null, next);
	
	}, done);
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
		that._write(pushPacket, cb);
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
	this.logger.info('TCP connection ended');
};

// private
Connection.prototype._handleError = function (error) {
	this.logger.error(error);
		
};

// private
Connection.prototype._handleDecrypt = function (data, cb) {
	this.cryptoEngine.decrypt(data, cb);
};

function executeCmd(that, cmd, parsedData, sessionData, cb) {
	var parser = that.packetParser; 
	var write = function (error, res, options, cb) {

		if (error) {
			that.logger.error('command response as error:', cmd.id, cmd.name, error);
			res = {
				message: error.message,
				code: error.code || null
			};
		}

		if (options && options.status) {
			res.code = options.status;
		}

		that._prepareWrite(state, res, function (error, data) {
			if (error) {
				if (typeof cb === 'function') {
					return cb(error);
				}
				return;
			}
			that.logger.info('response from server:', res);
			var replyPacket = parser.createReply(
				parser.status(res),
				parsedData.seq,
				data
			);
			that._write(replyPacket);

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
		STATUS: parser.STATUS_CODE,
		set: function (key, val) {
			that.data[key] = val;
		},
		get: function (key) {
			return (that.data.hasOwnProperty(key)) ? that.data[key] : null;
		},
		send: function (payload, cb) {
			that._push.apply(that, [state, payload, cb]);
		},
		payload: JSON.parse(parsedData.payload)
	};

	if (sessionData) {
		state.sessionId = sessionData.sessionId;
		state.seq = sessionData.seq;
		state.session = sessionData.data;
	}

	// execute command hooks
	cmd.hooks(state, function (error) {
		if (error) {
			var msg = {
				message: error.message,
				code: error.code || null
			};
			write(error, msg, cmd, null, cb);
			return;
		}	
		// execute command handler
		cmd.handler(state, function (error, res, options) {
			// move on: we do not pass error as we want to handle the res of the commands
			write(error, res, cmd, options, cb);
		});
	});
}

'use strict';

// TODO: there is no security here yet
// need to use .lib/pakcet/cryptoengine.js

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

// TODO: implement using cryptoEngine case
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
		that.logger.info('commands handled and responded:', 'commands:', list.join(','));
	};
	var routeAndExec = function (parsedData, sessionData, next) {
		var cmd = router.route(parsedData);
		
		if (!cmd) {
			that.logger.error(
				'command not found:', parsedData,
				'payload:', parsedData.payload
			);
			var notFound = parser.createReply(parser.STATUS_CODE.NOT_FOUND, parsedData.seq, '');
			that._write(notFound);
			return next();
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
Connection.prototype._write = function (data, cb) {
	if (this.sock) {
		this.sock.write(data, 'UTF-8', cb);
		this.logger.info('command response sent:', 'size:', this.sock.bufferSize + ' bytes');
		return;
	}
	this.logger.warn('TCP socket is gone');
};

// private/public: this will be called from command handlers 
Connection.prototype._push = function (state, payload, cb) {
	// move forward seq
	state.seq += 1;

	if (this.cryptoEngine.encrypt) {
		var that = this;
		this.logger.info('using encryption for sending packet to client');
		if (typeof payload === 'object' && !(payload instanceof Buffer)) {
			payload = JSON.stringify(payload);
		}
		this.cryptoEngine.encrypt(state, payload, function (error, encrypted) {
			if (error) {
				that.logger.error('encryption failed:', payload);
				return cb(error);
			}
			that.logger.info('encrypted push from server:', payload);
			var encryptedPacket = that.packetParser.createPush(encrypted);
			that._write(encryptedPacket, cb);
		});
		return;
	}

	this.logger.info('push from server:', payload);
	var pushPacket = this.packetParser.createPush(payload);
	this._write(pushPacket, cb);
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
		
		if (that.cryptoEngine.encrypt) {
			that.logger.info('using encryption for response to client');
			if (typeof res === 'object' && !(res instanceof Buffer)) {
				res = JSON.stringify(res);
			}	
			that.cryptoEngine.encrypt(state, res, function (error, encrypted) {
				if (error) {
					that.logger.error('encryption failed:', res);
					return cb(error);
				}
				that.logger.info('encrypted response to client:', res);
				var encryptedRepPacket = parser.createReply(
					parser.status(error),
					parsedData.req,
					encrypted
				);
				that._write(encryptedRepPacket);
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
			return;
		}

		that.logger.info('response from server:', res);
		var replyPacket = parser.createReply(parser.status(error), parsedData.seq, res);
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

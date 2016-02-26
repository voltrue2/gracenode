'use strict';

var async = require('async');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var gn = require('../gracenode');
var Packet = require('../../lib/packet');
// this is not HTTP router
var router = require('./router');

module.exports = Connection;

function Connection(connId, sock) {
	EventEmitter.call(this);
	this.connId = connId;
	this.sock = sock;
	this.self = (this.sock) ? this.sock.localAddress + ':' + this.sock.localPort : 'UNKNOWN';
	this.from = (this.sock) ? this.sock.remoteAddress + ':' + this.sock.remotePort : 'UNKNOWN';
	this.logger = gn.log.create(
		'RPC.connection(ID:' + connId + ')<local:' + this.self + '><remote:' + this.from + '>'
	);
	
	//this.sockTimeout = options.sockTimeout;
	//this.authTimeout = options.authTimeout;

	this.packetParser = new Packet();

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
	var parsed = this.packetParser.parse(packet);

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

	// route to commands and execute each command handler
	async.eachSeries(parsed, function (parsedData, next) {
		var cmd = router.route(parsedData);
		
		if (!cmd) {
			that.logger.error(
				'command not found:', parsedData,
				'payload:', JSON.parse(parsedData.payload)
			);
			var notFound = parser.createReply(parser.STATUS_CODE.NOT_FOUND, parsedData.seq, '');
			return that._write(notFound);
		}

		that.logger.info('command routing resolved:', 'command:', cmd.id, cmd.name);
		
		var state = {
			STATUS: parser.STATUS_CODE,
			push: function (payload, cb) {
				that._push.apply(that, [payload, cb]);
			},
			payload: JSON.parse(parsedData.payload)
		};
	
		// execute command handler
		cmd.handler(state, function (res, options) {
			var error;
			if (res instanceof Error) {
				that.logger.error('command:', cmd.id, cmd.name, res);
				error = res;
				res = {
					message: res.message,
					code: res.code || null
				};
			}
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
			// move on: we do not pass error as we want to handle the res of the commands
			next();
		});
	
	}, done);
};

// private
Connection.prototype._write = function (data, cb) {
	if (this.sock) {
		this.sock.write(data, 'UTF-8', cb);
		this.logger.info('command response sent:', 'size:', this.sock.bufferSize + 'bytes');
		return;
	}
	this.logger.warn('TCP socket is gone');
};

// private/public: this will be called from command handlers 
Connection.prototype._push = function (payload, cb) {
	var pushPacket = this.packetParser.createPush(payload);
	this.logger.info('push from server:', payload);
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

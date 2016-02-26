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
	this.logger = gn.log.create('RPC.connection');
	this.connId = connId;
	this.sock = sock;
	this.from = (this.sock) ? this.sock.remoteAddress + ':' + this.sock.remotePort : 'UNKNOWN';
	
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
	
	this.logger.info(
		'RPC connection close:',
		'(connection ID:' + this.connId + ')',
		'from:', this.from
	);

	if (!this.sock) {
		this.logger.warn(
			'RPC socket has already been gone:',
			'(connection ID:' + this.connId + ')'
		);
		return;
	}

	// this will invoke 'end event'
	this.sock.end();
};

// public
Connection.prototype.kill = function (error) {
	if (error) {
		this.logger.error(
			'RPC connection kill',
			'(connection ID:' + this.connId + ')',
			'from:', this.from,
			error
		);
	}
	if (!this.sock) {
		this.logger.warn(
			'RPC socket has already been gone before .kill:',
			'(connection ID:' + this.connId + ')'
		);
		return;
	}
	// this is a hard kill connection
	this.sock.destroy();
	this.sock = null;
	this.emit('kill');
};

// private
Connection.prototype._handleData = function (packet) {
	this.logger.verbose(
		'packet received: (connection ID:' + this.connId + '):',
		'from:', this.from
	);
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
		that.logger.info(
			'commands handled and responded:',
			'(connection ID:' + that.connId + ')',
			'from:', that.from,
			'commands:', list.join(',')
		);
	};

	// route to commands and execute each command handler
	async.series(parsed, function (parsedData, next) {
		var cmd = router.route(parsedData);
		
		if (!cmd) {
			that.logger.error(
				'command not found:',
				'(connection ID:' + that.connId + ')',
				'from:', that.from,
				parsedData
			);
			var notFound = parser.createReply(parser.STAUTS_CODE.NOT_FOUND, parsedData.seq, '');
			return that._write(notFound);
		}

		that.logger.info(
			'command routing resolved:',
			'(connection ID:' + that.connId + ')',
			'from:', that.from,
			'command:', cmd.id, cmd.name
		);
		
		var cmdParams = {
			STATUS: parser.STATUS_CODE,
			push: that._push,
			payload: parsedData.payload
		};
	
		// execute command handler
		cmd.handler(cmdParams, function (error, data, options) {
			if (error) {
				that.logger.error(
					'command:', cmd.id, cmd.name,
					'(connection ID:' + that.connId + ')',
					'from:', that.from,
					error
				);
			}
			var replyPacket = parser.createReply(parser.status(error), parsedData.seq, data);
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
		this.logger.info(
			'command response sent:',
			'(connection ID:' + this.connId + ')',
			'to:', this.from,
			'size:', this.sock.bufferSize + 'bytes'
		);
		return;
	}
	this.logger.warn(
		'TCP socket is gone:',
		'(connection ID:' + this.conndId + ')',
		'from:', this.from
	);
};

// private/public: this will be called from command handlers 
Connection.prototype._push = function (payload, cb) {
	var pushPacket = this.packetParser.createPush(payload);
	this._write(pushPacket, cb);
};

// private
Connection.prototype._handleEnd = function () {
	this.logger.info('connection ended: (connection ID:' + this.connId + ')');
};

// private
Connection.prototype._handleError = function (error) {
	this.logger.error('from:', this.from, error);
		
};

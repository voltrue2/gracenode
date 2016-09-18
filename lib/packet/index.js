'use strict';

var protocol = require('./protocol');
var STATUS = require('./status');

module.exports = Parser;

function Parser(logger) {
	this.logger = logger;
	this.chunkBuff = null;
	this.rxProxyPacket = false;
	// TODO: decide what to do with it
	this.proxyPacket = null;
}

Parser.prototype.parse = function __packetParse(incomingChunk) {

	if (!incomingChunk) {
		this.logger.verbose('incoming packet chunck is missing');
		return;
	}

	if (this.chunkBuff) {
		this.chunkBuff = Buffer.concat([this.chunkBuff, incomingChunk]);
	} else {
		this.chunkBuff = incomingChunk;
	}

	// list of packet to be routed to packet controllers
	var packetList = [];
	var packet = this._parse();
	var loopCount = 0;
	var warningThreshhold = 16;

	// kill connection immediately
	if (packet instanceof Error) {
		this.logger.error('parse error:', packet);
		return packet;
	}

	packetList.push(packet);
	
	while (packet) {
		packet = this._parse();

		// kill connection immediately
		if (packet instanceof Error) {
			return packet;
		}

		if (packet) {	
			packetList.push(packet);
		}

		loopCount += 1;
	
		if (loopCount >= warningThreshhold) {
			this.logger.warn('packet parse is caught in loop:', loopCount);
		}	

	}

	return packetList;
};

Parser.prototype.createReq = function __packetCreateReq(cmdId, seq, data) {
	return protocol.createNormalReqPacket(cmdId, seq, data);
};

Parser.prototype.createReply = function __packetCreateReply(status, seq, ack) {
	return protocol.createNormalReplyPacket(status, seq, ack);
};

Parser.prototype.createPush = function __packetCreatePush(payload) {
	return protocol.createPushPacket(payload);
};

Parser.prototype.STATUS_CODE = STATUS;

Parser.prototype.status = function __packetStatus(error) {
	if (error) {
		if (STATUS[error.message]) {
			return STATUS[error.message];
		}
		if (STATUS[error.code]) {
			return STATUS[error.code];
		}
		return STATUS.UNKNOWN;
	}
	return STATUS.OK;
};

Parser.prototype._parse = function __packetUparse() {
	var packet = protocol.parseData(this.chunkBuff);
	
	if (!packet) {
		return null;
	}

	if (packet instanceof Error) {
		return packet;
	}
	
	// free the amount of buffer consumed for this packet
	this.chunkBuff = this.chunkBuff.slice(packet.consumedLength);

	switch (packet.type) {
		case protocol.TYPES.PROXY_V1:
			if (this.rxProxyPacket) {
				return new Error('<OUT_OF_ORDER_DATA>: ' + packet.type);
			}
			this.rxProxyPacket = true;
			this.proxyPacket = packet;
			break;
		case protocol.TYPES.RPC:
			return packet;
		case protocol.TYPES.TEXT:
			return packet;
		default:
			return new Error('<UNKNOWN_PACKET_TYPE>: ' + packet.type);
	}
};

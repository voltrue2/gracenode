'use strict';

var protocol = require('./protocol');
var STATUS = require('./status');

module.exports = Parser;

function Parser() {
	this.chunkBuff = null;
	this.rxProxyPacket = false;
	// TODO: decide what to do with it
	this.proxyPacket = null;
}

Parser.prototype.parse = function (incomingChunk/*, cryptoEngine*/) {

	if (!incomingChunk) {
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

	// kill connection immediately
	if (packet instanceof Error) {
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
	}

	return packetList;
};

Parser.prototype.createReq = function (cmdId, seq, data) {
	return protocol.createNormalReqPacket(cmdId, seq, data);
};

Parser.prototype.createReply = function (status, seq, ack) {
	return protocol.createNormalReplyPacket(status, seq, ack);
};

Parser.prototype.createPush = function (payload) {
	return protocol.createPushPacket(payload);
};

Parser.prototype.STATUS_CODE = STATUS;

Parser.prototype.status = function (error) {
	if (error) {
		if (STATUS[error.message]) {
			return STATUS[error.messge];
		}
		if (STATUS[error.code]) {
			return STATUS[error.code];
		}
		return STATUS.UNKNOWN;
	}
	return STATUS.OK;
};

Parser.prototype._parse = function () {
	var packet;
	
	try {
		packet = protocol.parseData(this.chunkBuff);
	} catch (err) {
		return err;
	}
	
	if (!packet) {
		return null;
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
		case protocol.TYPES.WEBSOCK:
			return packet;
		default:
			return new Error('<UNKNOWN_PACKET_TYPE>: ' + packet.type);
	}
};

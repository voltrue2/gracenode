'use strict';

const _Buffer = require('../../src/buffer');
var CRLF = '\r\n';
var SPACE = ' ';
var MAX_PROXY_V1_LEN = 108;
var V0_PACKET_HEADER_SIZE = 8;
var V0_PACKET_STOP_SIZE = 4;
var PACKET_HEADSTOP_SIZE = V0_PACKET_HEADER_SIZE + V0_PACKET_STOP_SIZE;
// this is '\r\n' in hex
var MAGIC_STOP_SYMBOL = 0x5c725c6e;
// this value is configurable from configuration
var MAX_PAYLOAD_SIZE = 8000;
var KEYWORDS = {
	RPC: 'rpc',
	TEXT: 'text',
	PROXY: 'PROXY',
	PROXY_V1: 'proxy_v1'
};
var ERR = {
	UNKNOWN: '<UNKNOWN_PROTOCOL>',
	PV2_NOT_SUPPOSED: '<PROTOCOL_V2_NOT_SUPPORTED>',
	UNKNOW_PV1: '<UNKNOWN_PROXY_v1_PROTOCOL>',
	PAYLOAD_MAX: '<PAYLOAD_SIZE_LIMIT_EXCEEDED>',
	BAD_MAGIC_SYMBOL: '<BAD_MAGIC_STOP_SYMBOL>'
};
var OFFSET = {
	VER: 0,
	PLEN: 0,
	CMD: 4,
	SEQ: 6,
	PAYLOAD: 8
};

var logger;

module.exports.setup = function __packetProtoSetup(gn) {
	logger = gn.log.create('packet.protocol');
	if (gn.getConfig('rpc.maxPayloadSize')) {
		MAX_PAYLOAD_SIZE = gn.getConfig('rpc.maxPayloadSize');
	}
	logInfo('maximum packet payload size is:', MAX_PAYLOAD_SIZE, 'bytes');
};

module.exports.TYPES = KEYWORDS;

module.exports.parseData = parseData;

module.exports.createPushPacketVersion0 = createPushPacketVersion0;

// default version of the protocol:
module.exports.createPushPacket = createPushPacketVersion0;

module.exports.createNormalReplyPacketVersion0 = createNormalReplyPacketVersion0;

module.exports.createNormalReqPacketVersion0 = createNormalReqPacketVersion0;

// default version of the protocol:
module.exports.createNormalReqPacket = createNormalReqPacketVersion0;

// default version of the protocol
module.exports.createNormalReplyPacket = createNormalReplyPacketVersion0;

module.exports.createGroupLockErrorPacketVersion0 = createGroupLockErrorPacketVersion0;

// default version of the protocol:
module.exports.createGroupLockErrorPacket = createGroupLockErrorPacketVersion0;

// tries to parse one, single incoming packet from the client
function parseData(inputBuff) {
	if (inputBuff.length < 1) {
		// no data ignore
		return null;
	}
	
	var protocolVer = inputBuff.readUInt8(0);

	logVer('protocol version:', protocolVer);

	switch (protocolVer) {
		case 0:
			return parseRPCv0(inputBuff);
		case 0x50:
			// proxy protocol v1 starts with 'PROXY'
			return parseDataProxyVersion1(inputBuff);
		case 0x0d:
			// proxy protocol v2 starts with \x0d
			return new Error(ERR.PV2_NOT_SUPPORTED);
		default:
			return new Error(ERR.UNKNOWN);
	}
}

/*
- minimum packet is:
	"PROXY TCP4 1.2.3.4.6.7.8.9 2 3\r\n" (32 chars)
- maximum packet (for IPv4) is:
	"PROXY TCP4 255.255.255.255 255.255.255.255 65535 65535\r\n"  (56 chars)
- it might also be:
	"PROXY UNKNOWN\r\n"  (15 chars)
*/
function parseDataProxyVersion1(inputBuff) {

	logVer('parse packet as proxy v1');

	// so we MUST have at least 5 spaces and a CRLF 
	var inputStr = inputBuff.toString('ascii');

	if (inputStr.indexOf(CRLF) >= 0) {
		var sep = inputStr.split(CRLF);
		var pieces = sep[0].split(SPACE);
		if (pieces[0] !== KEYWORDS.PROXY) {
			logError(ERR.UNKNOWN_PV1, CRLF, 'is missing');
			return new Error(ERR.UNKNOWN_PV1);
		}
		if (pieces.length !== 6) {
			// this could be PROXY UNKNOWN also..
			logError(
				ERR.UNKNOWN_PV1,
				'incorrect size of chunck:',
				pieces.legth
			);
			return new Error(ERR.UNKNOWN_PV1);
		}
		var packet = {};
		packet.type = KEYWORDS.PROXY_V1;
		// packet.protocol should be either TCP4, TCP6, or UNKNOWN
		packet.protocol = pieces[1];
		packet.sourceIP = pieces[2];
		packet.destIP = pieces[3];
		packet.sourcePort = parseInt(pieces[4], 10);
		packet.destPort = parseInt(pieces[5], 10);
		// TODO: 2...
		packet.consumedLength = sep[0].length + 2;
		return packet; 
	}
	if (inputBuff.length > MAX_PROXY_V1_LEN) {
		// proxy v1 should never be longer than this
		logError(ERR.UNKNOWN_PV1, 'chunk too big');
		return new Error(ERR.UNKNOWN_PV1);
	}
	// we don't seem to have enough data yet
	return null;
}

/*
* this is the parser for gracenode rpc protocol
* Byte Position 0: uint8 0x0 === RPC type
* Byte Position 0: uint32 big endian === payload size
* Byte Position 4: uint16 big endian === command ID
* Byte Position 6: uint16 big endian === seq
*/
function parseRPCv0(inputBuff) {

	logVer('parse packet as RPC: packet size', inputBuff.length);

	if (inputBuff.length < PACKET_HEADSTOP_SIZE) {
		// we can't possibly have a complete packet yet
		return null;
	}

	// bitwise operation &
	var payloadLen = inputBuff.readUInt32BE(0) & 0x00ffffff;

	
	logVer('payload size:', payloadLen);
	
	if (payloadLen >= MAX_PAYLOAD_SIZE) {
		// disconnect now
		return new Error(ERR.PAYLOAD_MAX);
	}

	var packetLen = payloadLen + PACKET_HEADSTOP_SIZE;

	if (inputBuff.length >= packetLen) {
		var magicStopPos = payloadLen + V0_PACKET_HEADER_SIZE;
		var magic = inputBuff.slice(magicStopPos, magicStopPos + V0_PACKET_STOP_SIZE);
		var magicVal = magic.readUInt32BE(0);
	
		logVer('magic stop position and value:', magicStopPos, 'and', magicVal);

		if (magicVal === MAGIC_STOP_SYMBOL) {
			// we have a good packet
			var packet = {};
			var payload = _Buffer.alloc(payloadLen);
			packet.protocolVersion = 0;
			packet.type = KEYWORDS.RPC;
			packet.command = inputBuff.readUInt16BE(OFFSET.CMD);
			packet.seq = inputBuff.readUInt16BE(OFFSET.SEQ);
			packet.payload = payload;
			if (inputBuff.readUInt8(4) === 0x01) {
				packet.status = inputBuff.readUInt8(5); 
			}
			inputBuff.copy(payload, 0, V0_PACKET_HEADER_SIZE, magicStopPos);
			packet.consumedLength = packetLen;

			logVer('parsed RPC packet:', packet);

			return packet;
		}
	
		logVer('magic stop value', magicVal, 'must be same as', MAGIC_STOP_SYMBOL);

		// disconnect now
		return new Error(ERR.BAD_MAGIC_SYMBOL);
	}

	logVer('incomplete packet: must be', inputBuff.length, '>=', packetLen);

	// we don't have a complete packet yet
	return null;
}

/*
- uint16 pstatus: status field in the reply packet
- uint16 ack: ack field in the reply packet
- string/buffer: payload of the reply packet
*/
function createNormalReplyPacketVersion0(pstatus, ack, payloadIn) {
	var payload;
	
	if (payloadIn === null || payloadIn === undefined) {
		payload = '';
	} else if (typeof payloadIn === 'string' || Buffer.isBuffer(payloadIn)) {
		payload = payloadIn;
	} else {
		// buffer needs to be utf8 safe
		try {
			payload = _Buffer.alloc(JSON.stringify(payloadIn));
		} catch (e) {
			return new Error(e.message + ': ' + payloadIn);
		}
	}

	var packetLen = payload.length + PACKET_HEADSTOP_SIZE;
	var packet = _Buffer.alloc(packetLen);
	// payload length
	packet.writeUInt32BE(payload.length, 0);
	// protocol version 0
	packet.writeUInt8(0, 0);
	// flags = 0x01 == normal reply packet
	packet.writeUInt8(1, 4);
	// status (enum)
	packet.writeUInt8(pstatus, 5);
	// ack# to match the seq#
	packet.writeUInt16BE(ack, 6);
	
	if (typeof payload === 'string') {
		packet.write(payload, V0_PACKET_HEADER_SIZE);
	} else {
		// we assume payload is buffer
		payload.copy(packet, V0_PACKET_HEADER_SIZE);
	}

	logInfo('reply payload:', payloadIn, 'size:', payload.length);

	packet.writeUInt32BE(MAGIC_STOP_SYMBOL, V0_PACKET_HEADER_SIZE + payload.length);

	return packet;
}

function createPushPacketVersion0(payload) {
	var packet = createNormalReplyPacketVersion0(0, 0, payload);
	// flags = 0x00 == normal reply packet
	packet.writeUInt8(0, 4);
	return packet;
}

function createNormalReqPacketVersion0(cmdId, seq, payload) {
	var packet = createNormalReplyPacketVersion0(0, 0, payload);
	// protocol version 0 = RPC
	packet.writeUInt8(0, 0);
	// payload size
	packet.writeUInt32BE(payload.length, OFFSET.PLEN);
	packet.writeUInt16BE(cmdId, 4);
	packet.writeUInt16BE(seq, 6);
	return packet;
}

function createGroupLockErrorPacketVersion0(seq) {
	var packet = createNormalReplyPacketVersion0(0, 0, '');
	// flags = 0x03 == grouplock error 
	packet.writeUInt8(3, 4);
	packet.writeUInt16BE(seq, 6);
	return packet;
}

function logVer() {
	if (logger) {
		logger.verbose.apply(logger, arguments);
	}
}

function logInfo() {
	if (logger) {
		logger.info.apply(logger, arguments);
	}
}

function logError() {
	if (logger) {
		logger.error.apply(logger, arguments);
	}
}

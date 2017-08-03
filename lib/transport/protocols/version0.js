'use strict';

const _Buffer = require('../../../src/buffer');

// this value can be configured
var MAX_PAYLOAD_SIZE = 8000;

const TYPE = 'rpc';

// version 0
const VERSION = 0x0;
const SIZE_HEADER_SIZE = 8;
const SIZE_STOP_SIZE= 4;
// HEADER_SIZE + STOP_SIZE
const SIZE_HEADSTOP_SIZE = 8 + 4;

// protocol version 0 offsets
const OFFSET_VER = 0;
const OFFSET_PLEN = 0;
const OFFSET_CMD = 4;
const OFFSET_REPLY_FLAG = 4;
const OFFSET_STATUS = 5;
const OFFSET_SEQ = 6;

const MSTOP = 0x5c724c6e;

const ERR_PAYLOAD_MAX = '<PAYLOAD_SIZE_LIMIT_EXCEEDED>';
const ERR_BAD_MAGIC_SYMBOL = '<BAD_MAGIC_STOP_SYMBOL>';

module.exports.VERSION = VERSION;
module.exports.OFFSET_CMD = OFFSET_CMD;
module.exports.OFFSET_REPLY_FLAG = OFFSET_REPLY_FLAG;
module.exports.OFFSET_STATUS = OFFSET_STATUS;
module.exports.setup = setup;
module.exports.create = create;
module.exports.parse = parse;

function setup(maxSize) {
	if (maxSize) {
		MAX_PAYLOAD_SIZE = maxSize;
	}
}

function create(payload, status, seq) {
	const plen = payload.length + SIZE_HEADSTOP_SIZE;
	var packet = _Buffer.alloc(plen);
	// payload length
	packet.writeUInt32BE(payload.length, OFFSET_PLEN);
	// protocol version
	packet.writeUInt8(VERSION, OFFSET_VER);
	// reply flag 0x01 = normal reply
	packet.writeUInt8(0x01, OFFSET_REPLY_FLAG);
	// status enum
	packet.writeUInt8(status, OFFSET_STATUS);
	// seq
	packet.writeUInt16BE(seq, OFFSET_SEQ);
	// add payload to reply packet
	if (typeof payload === 'string') {
		packet.write(payload, SIZE_HEADER_SIZE);
	} else {
		// otherwise we assume payload to be buffer
		payload.copy(packet, SIZE_HEADER_SIZE);
	}
	// add magic stop symbol at the end
	packet.writeUInt32BE(MSTOP, SIZE_HEADER_SIZE + payload.length);
	return packet;
}

function parse(buf) {
	const bufLen = buf.length;
	if (bufLen < SIZE_HEADER_SIZE) {
		// incomplete packet, wait for more to come
		return null;
	}
	// calculate payload length
	const plen = buf.readUInt32BE(OFFSET_PLEN) & 0x00ffffff;
	if (plen >= MAX_PAYLOAD_SIZE) {
		// disconnect please
		return new Error(ERR_PAYLOAD_MAX);
	}
	// calculate packet size
	const packetLen = plen + SIZE_HEADSTOP_SIZE;
	if (bufLen < packetLen) {
		// incomplete packet, wait for more to come
		return null;
	}
	// parse payload
	return parsePayload(buf, plen);
}

function parsePayload(buf, plen) {
	// extract magic stop symbol
	const mStopPos = plen + SIZE_HEADER_SIZE;
	const mBytes = buf.slice(mStopPos, mStopPos + SIZE_STOP_SIZE);
	const mVal = mBytes.readUInt32BE(0);
	// validate stop symbol
	if (mVal !== MSTOP) {
		// please disconnect now...
		return new Error(ERR_BAD_MAGIC_SYMBOL);
	}
	// parse payload
	return _parsePayload(mStopPos, buf, _Buffer.alloc(plen));
}

function _parsePayload(mStopPos, buf, payload) {
	var packet = {};
	packet.protocolVersion = VERSION;
	packet.type = TYPE;
	packet.command = buf.readUInt16BE(OFFSET_CMD);
	packet.seq = buf.readInt16BE(OFFSET_SEQ);
	packet.payload = payload;
	// if reply flag is 0x01 we are parsing a reply packet
	if (buf.readUInt8(OFFSET_REPLY_FLAG) === 0x01) {
		// reply packet has reply status
		packet.status = buf.readUInt8(OFFSET_STATUS);
	}
	// copy bytes from buf to payload: from header to mstop
	buf.copy(packet.payload, 0, SIZE_HEADER_SIZE, mStopPos);
	// set consumed byte length
	packet.consumedLength = payload.length + SIZE_HEADSTOP_SIZE;
	return packet;
}

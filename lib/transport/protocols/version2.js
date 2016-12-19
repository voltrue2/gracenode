'use strict';

// this value can be configured
var MAX_PAYLOAD_SIZE = 8000;

const TYPE = 'rpc';

// version 2 but version number is 0x63
const VERSION = 0x63;
// payload size (4 bytes) + batch count (4 bytes)
const HEADER_SIZE = 5;
const STOP_SIZE= 4;
const HEADER_STOP_SIZE = HEADER_SIZE + STOP_SIZE;

// protocol version 10 offsets
const HEADER_OFFSET_VER = 0;
const HEADER_OFFSET_PLEN = 0;
const HEADER_OFFSET_COMMAND_COUNT = 4;

const MSTOP_VALUE = 0x5c724c6e;

var MSTOP = new Buffer(STOP_SIZE);
MSTOP.writeUInt32BE(MSTOP_VALUE);

const ERR_PAYLOAD_MAX = '<PAYLOAD_SIZE_LIMIT_EXCEEDED>';
const ERR_BAD_MAGIC_SYMBOL = '<BAD_MAGIC_STOP_SYMBOL>';

module.exports.VERSION = VERSION;
module.exports.setup = setup;
module.exports.create = create;
module.exports.parse = parse;

function setup(maxSize) {
	if (maxSize) {
		MAX_PAYLOAD_SIZE = maxSize;
	}
}

/***
payloads = [
	{ command: <command ID>, seq: <sequence number>, payload: <payload buffer> },
	{ ... }
];
**/
function create(payloads) {
	var packedPayloads = packPayloads(payloads);
	const psize = packedPayloads.length - STOP_SIZE;
	const totalSize = HEADER_STOP_SIZE + psize;
	var buf = new Buffer(totalSize);
	buf.fill(0);
	buf.writeUInt32BE(psize, HEADER_OFFSET_PLEN);
	buf.writeUInt8(VERSION, HEADER_OFFSET_VER);
	buf.writeUInt8(payloads.length, HEADER_OFFSET_COMMAND_COUNT);
	packedPayloads.copy(buf, HEADER_SIZE);
	return buf;
}

/***
payloads = [
	{ command: <command ID>, seq: <sequence number>,  payload: <payload buffer> },
	{ ... }
];
**/
function packPayloads(payloads) {
	if (!Array.isArray(payloads)) {
		payloads = [ payloads ];
	}
	var buf = new Buffer(MAX_PAYLOAD_SIZE);
	var offset = 0;
	buf.fill(0);
	for (var i = 0, len = payloads.length; i < len; i++) {
		const item = payloads[i];
		buf.writeUInt32BE(item.payload.length, offset);
		offset += 4;
		buf.writeUInt16BE(item.command, offset);
		offset += 2;
		buf.writeUInt16BE(item.seq, offset);
		offset += 2;
		if (typeof payload === 'string') {
			buf.write(item.payload, offset);
		} else {
			item.payload.copy(buf, offset);
		}
		offset += item.payload.length;
	}
	MSTOP.copy(buf, offset, 0);
	offset += STOP_SIZE;
	return buf.slice(0, offset);
}

function parse(buf) {
	const bufLen = buf.length;
	if (bufLen < HEADER_SIZE) {
		// incomplete packet, wait for more to come
		return null;
	}
	// calculate payload length
	const plen = buf.readUInt32BE(HEADER_OFFSET_PLEN) & 0x00ffffff;
	if (plen >= MAX_PAYLOAD_SIZE) {
		// disconnect please
		return new Error(ERR_PAYLOAD_MAX);
	}
	// calculate packet size
	const packetLen = plen + HEADER_STOP_SIZE;
	if (bufLen < packetLen) {
		// incomplete packet, wait for more to come
		return null;
	}
	// parse payload
	return parsePayload(buf, plen);
}

function parsePayload(buf, plen) {
	// extract magic stop symbol
	const mStopPos = plen + HEADER_SIZE;
	const mBytes = buf.slice(mStopPos, mStopPos + STOP_SIZE);
	const mVal = mBytes.readUInt32BE(0);
	// validate stop symbol
	if (mVal !== MSTOP_VALUE) {
		// please disconnect now...
		return new Error(ERR_BAD_MAGIC_SYMBOL);
	}
	// parse payload
	return _parsePayload(mStopPos, buf, new Buffer(plen));
}

function _parsePayload(mStopPos, buf, payloads) {
	var packet = {
		protocolVersion: VERSION,
		type: TYPE,
		payloads: []
	};
	// copy bytes from buf to payloads: from header to mstop
	buf.copy(payloads, 0, HEADER_SIZE, mStopPos);
	// parse payloads
	const count = buf.readUInt8(HEADER_OFFSET_COMMAND_COUNT);
	packet.payloads = _parsePayloads(count, payloads);
	// set consumed byte length
	packet.consumedLength = payloads.length + HEADER_STOP_SIZE;
	return packet;
}

function _parsePayloads(count, payloads) {
	var parsed = [];
	var offset = 0;
	for (var i = 0; i < count; i++) {
		const size = payloads.readUInt32BE(offset);
		offset += 4;
		var command = payloads.readUInt16BE(offset);
		offset += 2;
		var seq = payloads.readUInt16BE(offset);
		offset += 2;
		var payload = new Buffer(size);
		payload.fill(0);
		payloads.copy(payload, 0, offset);
		offset += size;
		parsed.push({
			command: command,
			seq: seq,
			payload: payload
		});
	}
	return parsed;
}

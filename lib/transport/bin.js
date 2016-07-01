'use strict';

var gn = require('../../src/gracenode');
var logger = gn.log.create('transport.binary');

// this value can be configured
var MAX_PAYLOAD_SIZE = 8000;
var SIZES = [
	// protocol version 0
	{
		HEADER_SIZE: 8,
		STOP_SIZE: 4,
		// HEADER_SIZE + STOP_SIZE
		HEADSTOP_SIZE: 8 + 4
	}
];
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
var OFFSETS = [
	// protocol version 0 offsets
	{
		VER: 0,
		PLEN: 0,
		CMD: 4,
		REPLY_FLAG: 4,
		STATUS: 5,
		SEQ: 6,
		PAYLOAD: 8
	}
];
var MSTOP = 0x5c724c6e;

module.exports.ERR = ERR;

module.exports.KEYWORS = KEYWORDS;

module.exports.setMaxSize = function (val) {
	MAX_PAYLOAD_SIZE = val;	
};

module.exports.parse = function (buf) {
	// TODO: check protocol version
	return parseV0(buf);
};

module.exports.createReply = function (status, seq, payload) {
	// TODO: add different protocol versions
	logger.verbose(
		'protocaol version:', 0,
		'reply packet:', 
		'(status:' + status + ')', '(seq:' + seq + ')',
		payload
	);
	return createReply(0, payload, status, seq);
};

module.exports.createPush = function (payload) {
	// TODO: add different protocol versions
	logger.verbose('protocaol version:', 0, 'push packet:', payload);
	return createPush(0, payload);
};

module.exports.createRequest = function (commandId, seq, payload) {
	// TODO: add different protocol versions
	logger.verbose(
		'protocaol version:', 0,
		'request packet:',
		'(command:' + commandId + ')', '(seq:' + seq + ')',
		payload
	);
	return createRequest(0, commandId, payload, seq);
};

function createRequest(version, command, payload, seq) {
	// request packet does not have status
	var status = 0;
	var packet = createReply(version, payload, status, seq);
	// add command to packet
	packet.writeUInt16BE(command, OFFSETS[version].CMD);
	return packet;
}

function createPush(version, payload) {
	// push packet has no status
	var status = 0;
	// push packet does not need seq
	var seq = 0;
	var packet = createReply(version, payload, status, seq);
	// push packet's reply flag = 0x00
	packet.writeUInt8(0x00, OFFSETS[version].REPLY_FLAG);
	return packet;
}

function createReply(version, _payload, status, seq) {
	var payload;
	if (_payload === null || _payload === undefined) {
		payload = '';
	} else if (typeof _payload === 'string' || Buffer.isBuffer(_payload)) {
		payload = _payload;
	} else {
		// buffer must be UTF-8 safe
		try {
			payload = new Buffer(JSON.stringify(_payload));
		} catch (e) {
			return new Error(e.message + ': ' + _payload);
		}
	}
	var size = SIZES[version];
	var offset = OFFSETS[version];
	var plen = payload.length + size.HEADSTOP_SIZE;
	var packet = new Buffer(plen);
	// payload length
	packet.writeUInt32BE(payload.length, offset.PLEN);
	// protocol version
	packet.writeUInt8(version, offset.VER);
	// reply flag 0x01 = normal reply
	packet.writeUInt8(0x01, offset.REPLY_FLAG);
	// status enum
	packet.writeUInt8(status, offset.STATUS);
	// seq
	packet.writeUInt16BE(seq, offset.SEQ);
	// add payload to reply packet
	if (typeof payload === 'string') {
		packet.write(payload, size.HEADER_SIZE);
	} else {
		// otherwise we assume payload to be buffer
		payload.copy(packet, size.HEADER_SIZE);
	}
	logger.verbose(
		'protocol version:', version,
		'payload size:', payload.length,
		'packet:', packet,
		'(size:' + plen + ')'
	);
	// add magic stop symbol at the end
	packet.writeUInt32BE(MSTOP, size.HEADER_SIZE + payload.length);
	return packet;
}

function parseV0(buf) {
	var size = SIZES[0];
	var protoName = '{protocol version 0}';
	var bufLen = buf.length;
	logger.verbose(protoName, 'packet: (size:' + bufLen + ')');
	if (bufLen < size.HEADER_SIZE) {
		// incomplete packet, wait for more to come
		return null;
	}
	// calculate payload length
	var plen = buf.readUInt32BE(OFFSETS[0].PLEN) & 0x00ffffff;
	logger.verbose(protoName, 'payload size:', plen);
	if (plen >= MAX_PAYLOAD_SIZE) {
		// disconnect please
		return new Error(ERR.PAYLOAD_MAX);
	}
	// calculate packet size
	var packetLen = plen + size.HEADSTOP_SIZE;
	if (bufLen < packetLen) {
		// incomplete packet, wait for more to come
		return null;
	}
	// parse payload
	return parseV0Payload(buf, plen);
}

function parseV0Payload(buf, plen) {
	var size = SIZES[0];
	// extract magic stop symbol
	var mStopPos = plen + size.HEADER_SIZE;
	var mBytes = buf.slice(mStopPos, mStopPos + size.STOP_SIZE);
	var mVal = mBytes.readUInt32BE(0);
	logger.verbose(
		'stop symbol:',
		'(position:' + mStopPos + ')',
		'(value:' + mVal + ')'
	);
	// validate stop symbol
	if (mVal !== MSTOP) {
		logger.error('incorrect magic stop symbol:', mVal);
		// please disconnect now...
		return new Error(ERR.BAD_MAGIC_SYMBOL);
	}
	// parse payload
	return createPacket(0, KEYWORDS.RPC, mStopPos, buf, new Buffer(plen));
}

function createPacket(version, type, mStopPos, buf, payload) {
	var offset = OFFSETS[version];
	var packet = {};
	packet.prototypeVersion = version;
	packet.type = type;
	packet.command = buf.readUInt16BE(offset.CMD);
	packet.seq = buf.readInt16BE(offset.CMD);
	try {
		packet.payload = JSON.parse(payload);
	} catch (e) {
		packet.payload = payload;
	} 
	// if reply flag is 0x01 we are parsing a reply packet
	if (buf.readUInt8(offset.REPLY_FLAG) === 0x01) {
		// reply packet has reply status
		packet.status = buf.readUInt8(offset.STATUS);
	}
	// copy bytes from buf to payload: from header to mstop
	buf.copy(packet.payload, 0, SIZES[version].HEADER_SIZE, mStopPos);
	// set consumed byte length
	packet.consumedLength = payload.length;
	logger.verbose(
		'protocol version:', version,
		'protocol type:', type,
		'parsed packet:', packet
	);
	return packet;
}

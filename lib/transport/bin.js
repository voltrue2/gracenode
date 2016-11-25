'use strict';

var gn = require('../../src/gracenode');
var logger;

// this value can be configured
var MAX_PAYLOAD_SIZE = 8000;

// version 0
const SIZE_0_HEADER_SIZE = 8;
const SIZE_0_STOP_SIZE= 4;
// HEADER_SIZE + STOP_SIZE
const SIZE_0_HEADSTOP_SIZE = 8 + 4;

const KEYWORD_RPC = 'rpc';
const KEYWORD_TEXT = 'text';
const KEYWORD_PROXY = 'PROXY';
const KEYWORD_PROXY_V1 = 'proxy_v1';

const ERR_UNKNOWN = '<UNKNOWN_PROTOCOL>';
const ERR_PV2_NOT_SUPPORTED = '<PROTOCOL_V2_NOT_SUPPORTED>';
//const ERR_UNKNOWN_PV1 = '<UNKNOWN_PROXY_v1_PROTOCOL>';
const ERR_PAYLOAD_MAX = '<PAYLOAD_SIZE_LIMIT_EXCEEDED>';
const ERR_BAD_MAGIC_SYMBOL = '<BAD_MAGIC_STOP_SYMBOL>';

// protocol version 0 offsets
const OFFSET_0_VER = 0;
const OFFSET_0_PLEN = 0;
const OFFSET_0_CMD = 4;
const OFFSET_0_REPLY_FLAG = 4;
const OFFSET_0_STATUS = 5;
const OFFSET_0_SEQ = 6;
//const OFFSET_0_PAYLOAD = 8;

var MSTOP = 0x5c724c6e;

module.exports.setup = function __transportBinSetup() {
	logger = gn.log.create('transport.bin');
};

module.exports.ERR = {
	UNKNOWN: ERR_UNKNOWN,
	PV2_NOT_SUPPORTED: ERR_PV2_NOT_SUPPORTED,
	UNKNOWN_PV1: ERR_UNKNOWN,
	PAYLOAD_MAX: ERR_PAYLOAD_MAX,
	BAD_MAGIC_SYMBOL: ERR_BAD_MAGIC_SYMBOL
};

module.exports.KEYWORS = {
	RPC: KEYWORD_RPC,
	TEXT: KEYWORD_TEXT,
	PROXY: KEYWORD_PROXY,
	PROXY_V1: KEYWORD_PROXY_V1
};

module.exports.setMaxSize = function __transportBinSetMaxSize(val) {
	MAX_PAYLOAD_SIZE = val;	
};

module.exports.getMaxPacketSize = function __transportBinGetMaxPacketSize() {
	return MAX_PAYLOAD_SIZE;
};

module.exports.parse = function __transportBinParse(buf) {
	// TODO: check protocol version
	return parseV0(buf);
};

module.exports.createReply = function __transportBinCreateReply(status, seq, payload) {
	// TODO: add different protocol versions
	return createReply(0, payload, status, seq);
};

module.exports.createPush = function __transportBinCreatePush(seq, payload) {
	// TODO: add different protocol versions
	return createPush(0, seq, payload);
};

module.exports.createRequest = function __transportBinCreateRequest(commandId, seq, payload) {
	// TODO: add different protocol versions
	return createRequest(0, commandId, payload, seq);
};

function createRequest(version, command, payload, seq) {
	// request packet does not have status
	var status = 0;
	var packet = createReply(version, payload, status, seq);
	// add command to packet
	packet.writeUInt16BE(command, OFFSET_0_CMD);
	return packet;
}

function createPush(version, seq, payload) {
	// push packet has no status
	var status = 0;
	var packet = createReply(version, payload, status, seq, 0);
	// push packet's reply flag = 0x00
	packet.writeUInt8(0x00, OFFSET_0_REPLY_FLAG);
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
	var plen = payload.length + SIZE_0_HEADSTOP_SIZE;
	var packet = new Buffer(plen);
	// payload length
	packet.writeUInt32BE(payload.length, OFFSET_0_PLEN);
	// protocol version
	packet.writeUInt8(version, OFFSET_0_VER);
	// reply flag 0x01 = normal reply
	packet.writeUInt8(0x01, OFFSET_0_REPLY_FLAG);
	// status enum
	packet.writeUInt8(status, OFFSET_0_STATUS);
	// seq
	packet.writeUInt16BE(seq, OFFSET_0_SEQ);
	// add payload to reply packet
	if (typeof payload === 'string') {
		packet.write(payload, SIZE_0_HEADER_SIZE);
	} else {
		// otherwise we assume payload to be buffer
		payload.copy(packet, SIZE_0_HEADER_SIZE);
	}
	// add magic stop symbol at the end
	packet.writeUInt32BE(MSTOP, SIZE_0_HEADER_SIZE + payload.length);
	return packet;
}

function parseV0(buf) {
	var bufLen = buf.length;
	if (bufLen < SIZE_0_HEADER_SIZE) {
		// incomplete packet, wait for more to come
		return null;
	}
	// calculate payload length
	var plen = buf.readUInt32BE(OFFSET_0_PLEN) & 0x00ffffff;
	if (plen >= MAX_PAYLOAD_SIZE) {
		// disconnect please
		return new Error(ERR_PAYLOAD_MAX);
	}
	// calculate packet size
	var packetLen = plen + SIZE_0_HEADSTOP_SIZE;
	if (bufLen < packetLen) {
		// incomplete packet, wait for more to come
		return null;
	}
	// parse payload
	return parseV0Payload(buf, plen);
}

function parseV0Payload(buf, plen) {
	// extract magic stop symbol
	var mStopPos = plen + SIZE_0_HEADER_SIZE;
	var mBytes = buf.slice(mStopPos, mStopPos + SIZE_0_STOP_SIZE);
	var mVal = mBytes.readUInt32BE(0);
	// validate stop symbol
	if (mVal !== MSTOP) {
		logger.error('incorrect magic stop symbol:', mVal);
		// please disconnect now...
		return new Error(ERR_BAD_MAGIC_SYMBOL);
	}
	// parse payload
	return parsePayload(0, KEYWORD_RPC, mStopPos, buf, new Buffer(plen));
}

function parsePayload(version, type, mStopPos, buf, payload) {
	var packet = {};
	packet.prototypeVersion = version;
	packet.type = type;
	packet.command = buf.readUInt16BE(OFFSET_0_CMD);
	packet.seq = buf.readInt16BE(OFFSET_0_SEQ);
	packet.payload = payload;
	// if reply flag is 0x01 we are parsing a reply packet
	if (buf.readUInt8(OFFSET_0_REPLY_FLAG) === 0x01) {
		// reply packet has reply status
		packet.status = buf.readUInt8(OFFSET_0_STATUS);
	}
	// copy bytes from buf to payload: from header to mstop
	buf.copy(packet.payload, 0, SIZE_0_HEADER_SIZE, mStopPos);
	// set consumed byte length
	packet.consumedLength = payload.length + SIZE_0_HEADSTOP_SIZE;
	return packet;
}

function Stream() {
	this.buffer = null;
}

Stream.prototype.parse = function __transportStreamParse(buf) {
	if (!buf) {
		return logger.verbose('stream buffer is missing');
	}
	if (this.buffer) {
		this.buffer = Buffer.concat([ this.buffer, buf ]);
	} else {
		this.buffer = buf;
	}
	var parsedList = [];
	var parsed = this._parse();
	var loopCount = 0;
	var warningThreshold = 16;
	
	// kill connection immediately
	if (parsed instanceof Error) {
		return parsed;
	}

	parsedList.push(parsed);

	while (parsed) {
		parsed = this._parse();
		// kill connection immediately
		if (parsed instanceof Error) {
			return parsed;
		}
		if (parsed) {
			parsedList.push(parsed);
		}
		loopCount += 1;
		if (loopCount >= warningThreshold) {
			logger.warn('buffer parser is cought in loop:', loopCount);
		}
	}

	return parsedList;
};

Stream.prototype._parse = function __transportStreamUparse() {
	var parsed = module.exports.parse(this.buffer);
	if (!parsed) {
		return null;
	}
	if (parsed instanceof Error) {
		return parsed;
	}
	// free the amount of buffer parsed for this packet
	this.buffer = this.buffer.slice(parsed.consumedLength);
	// done
	return parsed;
};

module.exports.Stream = Stream;

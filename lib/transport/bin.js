'use strict';

var gn = require('../../src/gracenode');
var logger;

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

module.exports.setup = function __transportBinSetup() {
	logger = gn.log.create('transport.bin');
};

module.exports.ERR = ERR;

module.exports.KEYWORS = KEYWORDS;

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
	packet.writeUInt16BE(command, OFFSETS[version].CMD);
	return packet;
}

function createPush(version, seq, payload) {
	// push packet has no status
	var status = 0;
	var packet = createReply(version, payload, status, seq, 0);
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
	// add magic stop symbol at the end
	packet.writeUInt32BE(MSTOP, size.HEADER_SIZE + payload.length);
	return packet;
}

function parseV0(buf) {
	var size = SIZES[0];
	var bufLen = buf.length;
	if (bufLen < size.HEADER_SIZE) {
		// incomplete packet, wait for more to come
		return null;
	}
	// calculate payload length
	var plen = buf.readUInt32BE(OFFSETS[0].PLEN) & 0x00ffffff;
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
	// validate stop symbol
	if (mVal !== MSTOP) {
		logger.error('incorrect magic stop symbol:', mVal);
		// please disconnect now...
		return new Error(ERR.BAD_MAGIC_SYMBOL);
	}
	// parse payload
	return parsePayload(0, KEYWORDS.RPC, mStopPos, buf, new Buffer(plen));
}

function parsePayload(version, type, mStopPos, buf, payload) {
	var offset = OFFSETS[version];
	var packet = {};
	packet.prototypeVersion = version;
	packet.type = type;
	packet.command = buf.readUInt16BE(offset.CMD);
	packet.seq = buf.readInt16BE(offset.SEQ);
	packet.payload = payload;
	// if reply flag is 0x01 we are parsing a reply packet
	if (buf.readUInt8(offset.REPLY_FLAG) === 0x01) {
		// reply packet has reply status
		packet.status = buf.readUInt8(offset.STATUS);
	}
	// copy bytes from buf to payload: from header to mstop
	buf.copy(packet.payload, 0, SIZES[version].HEADER_SIZE, mStopPos);
	// set consumed byte length
	packet.consumedLength = payload.length + SIZES[version].HEADSTOP_SIZE;
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

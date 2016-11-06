'use strict';

var gn = require('../../src/gracenode');
var json = require('./json');
var bin = require('./bin');
var logger;

var TYPES = [
	'json',
	'binary'
];

var STATUS = {
	OK: 1,
	BAD_REQ: 2,
	FORBIDDEN: 3,
	NOT_FOUND: 4,
	SERVER_ERR: 5,
	UNAVAILABLE: 6,
	UNKNOWN: 99
};

var inUse = 'binary';

module.exports.STATUS = STATUS;

module.exports.setup = function __transportSetup() {
	logger = gn.log.create('transport');
	json.setup();
	bin.setup();
};

module.exports.use = function __transportUse(type) {
	if (TYPES.indexOf(type) === -1) {
		throw new Error('InvalidTransportProtocolType');
	}
	inUse = type;
};

module.exports.setMaxSize = function __transportSetMaxSize(size) {
	var proto = getProto();
	if (proto.setMaxSize) {
		proto.setMaxSize(size);
	}
};

module.exports.getMaxPacketSize = function __transportGetMaxPacketSize() {
	var proto = getProto();
	if (proto.getMaxPacketSize) {
		return proto.getMaxPacketSize();
	}
	return null;
};

module.exports.isJson = function __transportIsJson() {
	return inUse === 'json';
};

// for RPC
module.exports.Stream = bin.Stream;

module.exports.parse = function __transportParse(buf) {
	// TODO: add protocol version
	var proto = getProto();
	return proto.parse(buf);
};

module.exports.createReply = function __transportCreateReply(status, seq, payload, command) {
	// TODO: add protocol version
	var proto = getProto();
	return proto.createReply(status, seq, payload, command);
};

module.exports.createPush = function __transportCreatePush(seq, payload) {
	// TODO: add protocol version
	var proto = getProto();
	return proto.createPush(seq, payload);
};

module.exports.createRequest = function __transportCreateRequest(commandId, seq, payload) {
	// TODO: add protocol version
	var proto = getProto();
	return proto.createRequest(commandId, seq, payload);
};

module.exports.getStatus = function __transportGetStatus(res) {
	if (res instanceof Error) {
		if (STATUS[res.message]) {
			return STATUS[res.message];
		}
		if (STATUS[res.code]) {
			return STATUS[res.code];
		}
		return STATUS.UNKNOWN;
	}
	return STATUS.OK;
};

function getProto() {
	switch (inUse) {
		case TYPES[0]:
			// TODO: implement JSON
			return json;
		case TYPES[1]:
			// binary
			return bin;
		// no case for default
	}
}

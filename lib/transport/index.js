'use strict';

var gn = require('../../src/gracenode');
var json = require('./json');
var bin = require('./bin');
var logger;

const TYPE_JSON = 0;
const TYPE_BIN = 1;
const TYPE_JSON_NAME = 'json';
const TYPE_BIN_NAME = 'binary';

const S_OK = 1;
const S_BAD_REQ = 2;
const S_FORBIDDEN = 3;
const S_NOT_FOUND = 4;
const S_SERVER_ERR = 5;
const S_UNAVAILABLE = 6;
const S_UNKNOWN =99;
const S_OK_NAME = 'OK';
const S_BAD_REQ_NAME = 'BAD_REQ';
const S_FORBIDDEN_NAME = 'FORBIDDEN';
const S_NOT_FOUND_NAME = 'NOT_FOUND';
const S_SERVER_ERR_NAME = 'SERVER_ERR';
const S_UNAVAILABLE_NAME = 'UNAVAILABLE';
const S_UNKNOWN_NAME = 'UNKNOWN';

var inUse = TYPE_BIN;

module.exports.STATUS = {
	OK: S_OK,
	BAD_REQ: S_BAD_REQ,
	FORBIDDEN: S_FORBIDDEN,
	NOT_FOUND: S_NOT_FOUND,
	SERVER_ERR: S_SERVER_ERR,
	UNAVAILABLE: S_UNAVAILABLE,
	UNKNOWN: S_UNKNOWN
};

module.exports.setup = function __transportSetup() {
	logger = gn.log.create('transport');
	json.setup();
	bin.setup();
};

module.exports.use = function __transportUse(_type) {
	var type;
	switch (_type) {
		case TYPE_JSON_NAME:
			type = 0;
			break;
		case TYPE_BIN_NAME:
			type = 1;
			break;
	}
	if (type !== TYPE_JSON && type !== TYPE_BIN) {
		throw new Error('InvalidTransportProtocolType');
	}
	inUse = type;
};

module.exports.setMaxSize = function __transportSetMaxSize(size) {
	var proto = getProto();
	if (proto.setMaxSize) {
		proto.setMaxSize(size);
	}
	logger.info('max packet size:', size);
};

module.exports.getMaxPacketSize = function __transportGetMaxPacketSize() {
	var proto = getProto();
	if (proto.getMaxPacketSize) {
		return proto.getMaxPacketSize();
	}
	return null;
};

module.exports.isJson = function __transportIsJson() {
	return inUse === TYPE_JSON;
};

// for RPC
module.exports.Stream = bin.Stream;

/***
currently uses:
version 0
version 10
**/
module.exports.parse = function __transportParse(buf) {
	var proto = getProto();
	return proto.parse(buf);
};

// version 0 only
module.exports.createReply = function __transportCreateReply(status, seq, payload, command) {
	var proto = getProto();
	return proto.createReply(status, seq, payload, command);
};

// version 0 only
module.exports.createPush = function __transportCreatePush(seq, payload) {
	var proto = getProto();
	return proto.createPush(seq, payload);
};

// version 0 only
module.exports.createRequest = function __transportCreateRequest(commandId, seq, payload) {
	var proto = getProto();
	return proto.createRequest(commandId, seq, payload);
};

// version 10 only
/***
dataList = [
        { command: <command ID>, seq: <sequence>, payload: <payload buffer> },
        { ... }
];
**/
module.exports.createBatchRequest = function __transportCreateBatchtRequest(dataList) {
	return bin.createBatchRequest(dataList); 
};

module.exports.getStatus = function __transportGetStatus(res) {
	if (res instanceof Error) {
		switch (res.message) {
			case S_OK_NAME:
				return S_OK;
			case S_NOT_FOUND_NAME:
				return S_NOT_FOUND;
			case S_BAD_REQ_NAME:
				return S_BAD_REQ;
			case S_FORBIDDEN_NAME:
				return S_FORBIDDEN;
			case S_SERVER_ERR_NAME:
				return S_SERVER_ERR;
			case S_UNAVAILABLE_NAME:
				return S_UNAVAILABLE;
			case S_UNKNOWN_NAME:
				return S_UNKNOWN;
		}
		switch (res.code) {
			case S_OK_NAME:
				return S_OK;
			case S_NOT_FOUND_NAME:
				return S_NOT_FOUND;
			case S_BAD_REQ_NAME:
				return S_BAD_REQ;
			case S_FORBIDDEN_NAME:
				return S_FORBIDDEN;
			case S_SERVER_ERR_NAME:
				return S_SERVER_ERR;
			case S_UNAVAILABLE_NAME:
				return S_UNAVAILABLE;
			case S_UNKNOWN_NAME:
				return S_UNKNOWN;
		}
		return S_UNKNOWN;
	}
	return S_OK;
};

function getProto() {
	switch (inUse) {
		case TYPE_JSON:
			// TODO: implement JSON
			return json;
		case TYPE_BIN:
			// binary
			return bin;
		// no case for default
	}
}

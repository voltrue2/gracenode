'use strict';

var gn = require('../../src/gracenode');
var json = require('./json');
var bin = require('./bin');
var logger = gn.log.create('transport');

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

module.exports.use = function (type) {
	if (TYPES.indexOf(type) === -1) {
		throw new Error('InvalidTransportProtocolType');
	}
	inUse = type;
};

module.exports.isJson = function () {
	return inUse === 'json';
};

module.exports.parse = function (buf) {
	// TODO: add protocol version
	logger.verbose('packet parse using', inUse);
	var proto = getProto();
	return proto.parse(buf);
};

module.exports.createReply = function (status, seq, payload) {
	// TODO: add protocol version
	logger.verbose('create reply using', inUse);
	var proto = getProto();
	return proto.createReply(status, seq, payload);
};

module.exports.createPush = function (seq, payload) {
	// TODO: add protocol version
	logger.verbose('create push using', inUse);
	var proto = getProto();
	return proto.createPush(seq, payload);
};

module.exports.createRequest = function (commandId, seq, payload) {
	// TODO: add protocol version
	logger.verbose('create request using', inUse);
	var proto = getProto();
	return proto.createRequest(commandId, seq, payload);
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

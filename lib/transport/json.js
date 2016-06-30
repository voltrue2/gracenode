'use strict';

var gn = require('../../src/gracenode');
var logger = gn.log.create('transport.json');

module.exports.parse = function (buf) {
	var str = buf.toString();
	logger.verbose('parse json packet:', str);
	try{
		return JSON.parse(str);
	} catch (e) {
		throw new Error('InvalidJSON:\n' + str);
	}
};

module.exports.createReply = function (status, seq, msg) {
	if (typeof msg !== 'object' || Buffer.isBuffer(msg)) {
		return msg;
	}
	msg.reply = true;
	msg.seq = seq;
	return JSON.stringify(msg);
};

module.exports.createPush = function (msg) {
	if (typeof msg !== 'object' || Buffer.isBuffer(msg)) {
		return msg;
	}
	return JSON.stringify(msg);
};

module.exports.createRequest = function (commandId, seq, msg) {
	if (typeof msg !== 'object') {
		return msg;
	}
	msg.command = commandId;
	msg.seq = seq;
	return JSON.stringify(msg);
};

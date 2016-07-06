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
	var json = {
		reply: true,
		seq: seq,
		payload: msg
	};
	return JSON.stringify(json);
};

module.exports.createPush = function (seq, msg) {
	var json = {
		seq: seq,
		payload: msg	
	};
	return JSON.stringify(json);
};

module.exports.createRequest = function (commandId, seq, msg) {
	var json = {
		command: commandId,
		seq: seq, 
		payload: msg
	};
	return JSON.stringify(json);
};

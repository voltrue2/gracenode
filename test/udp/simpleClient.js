'use strict';

var transport = require('../../lib/transport');
var gn = require('../../src/gracenode');
var ce = new gn.lib.CryptoEngine();
var dgram = require('dgram');
var client = dgram.createSocket('udp4');

client.on('error', function (error) {
	throw new Error(error);
});

exports.useBinary = function () {
	transport.use('binary');
};

exports.useJson = function () {
	transport.use('json');
};

exports.sender = function (port, command, seq, msg, cb) {
	var buff = transport.createRequest(command, seq, msg);
	client.send(buff, 0, buff.length, port, 'localhost', cb);
};

exports.receiver = function (cb) {
	client.once('message', function (buff) {
		var parsed = transport.parse(buff);
		var payload = parsed.payload.toString();
		try {
			cb(JSON.parse(payload), parsed.seq);
		} catch (e) {
			cb(payload, parsed.seq);
		}
	});
};

exports.secureReceiver = function (cipher, cb) {
	client.once('message', function (buff) {
		var decrypted = ce.decrypt(
			cipher.cipherKey,
			cipher.cipherNonce,
			cipher.macKey,
			cipher.seq,
			buff
		);
		var parsed = transport.parse(decrypted);
		var payload = parsed.payload.toString();
		try {
			cb(JSON.parse(payload), parsed.seq);
		} catch (e) {
			cb(payload, parsed.seq);
		}
	});
};

exports.secureSender = function (port, sid, cipher, command, seq, msg, cb) {
	var uuid = gn.lib.uuid.create(sid);
	var session = new Buffer(16 + 4);
	uuid.toBytes().copy(session, 0, 0, uuid.getByteLength());
	session.writeUInt32BE(cipher.seq, 16);
	var encrypted = ce.encrypt(
		cipher.cipherKey,
		cipher.cipherNonce,
		cipher.macKey,
		cipher.seq,
		JSON.stringify(msg)
	);
	var payload = Buffer.concat([session, encrypted]);
	exports.sender(port, command, seq || 0, payload, cb);
};

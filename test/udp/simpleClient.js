'use strict';

var gn = require('../../src/gracenode');
var ce = new gn.lib.CryptoEngine();
var dgram = require('dgram');
var client = dgram.createSocket('udp4');

client.on('error', function (error) {
	throw new Error(error);
});

exports.sender = function (port, msg, cb) {
	var buff;
	if (msg instanceof Buffer) {
		buff = msg;
	} else {
		buff = new Buffer(JSON.stringify(msg));
	}
	client.send(buff, 0, buff.length, port, 'localhost', cb);
};

exports.receiver = function (cb) {
	client.once('message', function (buff) {
		cb(buff.toString());
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
		cb(null, decrypted);
	});
};

exports.secureSender = function (port, sid, cipher, msg, cb) {
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
	exports.sender(port, payload, cb);
};

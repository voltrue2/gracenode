'use strict';

var gn = require('../../src/gracenode');
var ce = new gn.lib.CryptoEngine();
var net = require('net');
var client = new net.Socket();
var PacketParser = require('../../lib/packet');
var packetParser;
var protocol = require('../../lib/packet/protocol');

var logger;

exports.start = function (host, port, cb) {
	logger = gn.log.create();
	packetParser = new PacketParser(logger);
	logger.debug('client connecting to', host + ':' + port);
	client.connect(port, host, cb);
};

exports.sender = function (commandId, seq, msg, cb) {

	if (!(msg instanceof Buffer)) {
		msg = JSON.stringify(msg);
	}
	
	logger.debug('client sending', commandId, seq, msg);

	var packet = packetParser.createReq(commandId, seq, msg);
	client.write(packet, cb);
};

exports.receiver = function (cb) {
	client.once('data', function (packet) {
		var parsed = packetParser.parse(packet);
		logger.debug('client received:', JSON.parse(parsed[0].payload));
		cb(JSON.parse(parsed[0].payload));
	});
};

exports.secureSender = function (sid, cipher, commandId, seq, msg, cb) {
	var uuid = gn.lib.uuid.create(sid);
	var session = new Buffer(16 + 4);
	uuid.toBytes().copy(session, 0, 0, uuid.getByteLength());
	session.writeUInt32BE(seq, 16);

	logger.debug('request encrypted w/', sid, seq);

	var encrypted = ce.encrypt(
		cipher.cipherKey,
		cipher.cipherNounce,
		cipher.macKey,
		seq,
		JSON.stringify(msg)
	);
	var payload = Buffer.concat([ session, encrypted ]);
	exports.sender(commandId, seq, payload, cb);
};

exports.secureReceiver = function (cipher, cb) {
	client.once('data', function (packet) {
		var parsed = packetParser.parse(packet);
		try {
			var decrypted = ce.decrypt(
				cipher.cipherKey,
				cipher.cipherNounce,
				cipher.macKey,
				cipher.seq,
				parsed[0].payload
			);
			logger.debug('client received encrypted:', decrypted.toString());
			cb(JSON.parse(decrypted.toString()));
		} catch (e) {
			cb(e);
		}
	});
};

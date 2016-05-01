'use strict';

var gn = require('../../src/gracenode');
var ce = new gn.lib.CryptoEngine();
var net = require('net');
var PacketParser = require('../../lib/packet');
var packetParser;

var portCount = 0;
var logger;

function Client() {
	this.logger = gn.log.create();
	this.parser = new PacketParser(logger);
	this.client = new net.Socket();
}

Client.prototype.start = function (host, port, cb) {
	this.logger.debug('client connect to:', host, port);
	this.client.connect(port, host, cb);
};

Client.prototype.stop = function (cb) {
	this.logger.debug('client disconnect');
	this.client.end();
	setTimeout(cb, 1000);
};

Client.prototype.send = function (commandId, seq, msg, cb) {

	if (!(msg instanceof Buffer)) {
		msg = JSON.stringify(msg);
	}
	
	this.logger.debug('client sending', commandId, seq, msg);

	var packet = this.parser.createReq(commandId, seq, msg);
	this.client.write(packet, cb);

};

Client.prototype.recvOnce = function (cb) {
	var that = this;
	this.client.once('data', function (packet) {
		that.client.removeAllListeners('close');
		var parsed = that.parser.parse(packet);
		that.logger.debug('client received:', JSON.parse(parsed[0].payload));
		cb(JSON.parse(parsed[0].payload));
	});
	this.client.once('close', function () {
		cb(new Error('closed'));
	});

};

Client.prototype.recv = function (cb) {
	var seq = cipher.seq;
	var that = this;
	this.client.on('data', function (buffer) {
		var packets = that.parser.parse(buffer);
		for (var i = 0, len = packets.length; i < len; i++) {
			var packet = packets[i];
			if (!packet) {
				continue;
			}
			seq += 1;
			that.logger.debug('recv seq:', seq);
			if (cipher) {
				packet = ce.decrypt(
					cipher.cipherKey,
					cipher.cipherNonce,
					cipher.macKey,
					seq,
					packet.payload
				).toString();
			} else {
				packet = packet.payload;

			}
			try {
				cb(JSON.parse(packet));
			} catch (e) {
				cb(e);
			}
		}
	});

};

Client.prototype.sendSecure = function (sid, cipher, commandId, seq, msg, cb) {
	var uuid = gn.lib.uuid.create(sid);
	var session = new Buffer(16 + 4);
	uuid.toBytes().copy(session, 0, 0, uuid.getByteLength());
	session.writeUInt32BE(seq, 16);
	var encrypted = ce.encrypt(
		cipher.cipherKey,
		cipher.cipherNonce,
		cipher.macKey,
		seq,
		JSON.stringify(msg)
	);
	var payload = Buffer.concat([ session, encrypted ]);
	this.logger.debug('sender seq:', seq);
	this.send(commandId, seq, payload, cb);
};

Client.prototype.recvOnceSecure = function (cipher, cb) {
	var that = this;
	this.client.once('data', function (packet) {
		that.client.removeAllListeners('close');
		var parsed = that.parser.parse(packet);
		try {
			var decrypted = ce.decrypt(
				cipher.cipherKey,
				cipher.cipherNonce,
				cipher.macKey,
				cipher.seq,
				parsed[0].payload
			);
			that.logger.debug('client received encrypted:', decrypted.toString());
			cb(JSON.parse(decrypted.toString()));
		} catch (e) {
			cb(e);
		}
	});
	this.client.once('close', function () {
		cb(new Error('closed'));
	});
};

module.exports = Client;

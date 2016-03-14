'use strict';

var fs = require('fs');
var gn = require('../../src/gracenode');
var dgram = require('dgram');
var client = dgram.createSocket('udp4');
var host = process.argv[2];
var ports = process.argv[3].split(',');
var speed = process.argv[4] || 3000;
var counter = 0;

var SESS_PATH = './sess';
var sess = JSON.parse(fs.readFileSync(SESS_PATH, 'utf8'));
var seq = 0;
// turn them back to buffer
sess.cipherKey = new Buffer(sess.cipherKey.data);
sess.cipherNounce = new Buffer(sess.cipherNounce.data);
sess.macKey = new Buffer(sess.macKey.data);

gn.config({
	cluster: {
		max: 4
	}
});

gn.start(loop);

function loop() {
	if (gn.isMaster()) {
		return;
	}
	setTimeout(function () {
		var s = Date.now();
		var ce = new gn.lib.CryptoEngine();
		var uuid = gn.lib.uuid.v4();
		// TOKEN_LEN + SEQ_LEN
		var session = new Buffer(16 + 4);
		// copy UUID in bytes into session buffer
		// .copy(targetBuff, targetStart, sourceStart, sourceEnd)
		uuid.toBytes().copy(session, 0, 0, uuid.getByteLength());
		// write seq at 16 byte
		session.writeUInt32BE(seq, 16);
		// encrypt payload data
		var data = {
			command: 1,
			message: 'Hello',
			timestamp: Date.now()
		};
		var encrypted = ce.encrypt(
			sess.cipherKey,
			sess.cipherNounce,
			sess.macKey,
			seq,
			new Buffer(JSON.stringify(data))
		);
		var payload = Buffer.concat([
			session,
			encrypted
		]);
		seq += 1;
		send(s, payload);
	}, speed);
}

function send(s, data) {
	var offset = 0;
	var length = data.length;
	client.send(data, offset, length, ports[counter], host, function (error) {
		if (error) {
			console.error('error:', error);
		}
		counter += 1;
	
		if (!ports[counter]) {
			counter = 0;
		}

		console.log('done sent size:', length, (Date.now() - s) + 'ms', process.pid);
		loop();
	});
}

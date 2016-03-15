'use strict';

var req = require('../src/request');
var async = require('async');
var gn = require('../../src/gracenode');
var dgram = require('dgram');
var client = dgram.createSocket('udp4');
var loop = process.argv[2] ? parseInt(process.argv[2], 10) : 0;
var waitTime = process.argv[3] ? parseInt(process.argv[3], 10) : 0;
var host = process.argv[4] || 'localhost';
var httpPort = process.argv[5] || 7979;

var sess;

gn.config({
	cluster: {
		max: 0
	}
});

gn.start(function () {

	var tasks = [
		auth,
		sendUDPLoop,
		wait,
		sendUDPLoop
	];

	async.series(tasks, function (error) {
		if (error) {
			console.error('***Error', error);
			return process.exit(1);
		}
		console.log('Done');
		process.exit();
	});

});

function auth(next) {
	req.POST('http://' + host + ':' + httpPort + '/auth', null, null, function (error, res, st) {
		if (error) {
			return next(error);
		}
		if (st >= 399) {
			return next(new Error('StatusCode' + st));
		}
		sess = {
			cipherKey: new Buffer(res.cipherData.cipherKey.data),
			cipherNounce: new Buffer(res.cipherData.cipherNounce.data),
			macKey: new Buffer(res.cipherData.macKey.data),
			seq: res.cipherData.seq,
			host: res.host,
			port: res.port,
			sessionId: res.sessionId
		};
		console.log('authenticated:', sess);
		next();
	});
}

function wait(next) {
	console.log('waiting for', waitTime, 'msec');
	setTimeout(next, waitTime);
}

function sendUDPLoop(next) {
	var count = 0;
	var send = function () {
		setTimeout(function () {
			console.log('sending packet:', count + '/' + loop);
			sendUDP(function (error) {
				if (error) {
					return next(error);
				}
				if (count === loop) {
					return next();
				}
				count += 1;
				send();
			});
		}, 100);
	};
	send();
}

function sendUDP(cb) {
	var offset = 0;
	var ce = new gn.lib.CryptoEngine();
	var uuid = gn.lib.uuid.create(sess.sessionId);
	// TOKEN_LEN + SEQ_LEN
	var session = new Buffer(16 + 4);
	// copy UUID in bytes into session buffer
	// .copy(targetBuff, targetStart, sourceStart, sourceEnd)
	uuid.toBytes().copy(session, 0, 0, uuid.getByteLength());
	// write seq at 16 byte
	session.writeUInt32BE(sess.seq, 16);
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
		sess.seq++,
		new Buffer(JSON.stringify(data))
	);
	var payload = Buffer.concat([
		session,
		encrypted
	]);
	var length = payload.length;
	client.send(payload, offset, length, sess.port, sess.host, function (error) {
		if (error) {
			return cb(error);
		}

		console.log('done sent size:', length, process.pid);
		
		cb();
	});
}

/*
var counter = 0;
var sess = JSON.parse(fs.readFileSync(SESS_PATH, 'utf8'));
var seq = 0;
// turn them back to buffer
sess.cipherKey = new Buffer(sess.cipherKey.data);
sess.cipherNounce = new Buffer(sess.cipherNounce.data);
sess.macKey = new Buffer(sess.macKey.data);

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
*/

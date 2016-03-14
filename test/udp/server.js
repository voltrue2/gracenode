'use strict';

var fs = require('fs');
var gn = require('../../src/gracenode');
var SESS_PATH = './sess';

var crypto = require('crypto');
var CryptoEngine = gn.lib.CryptoEngine;
var ce = new CryptoEngine();

gn.config({
	udp: {
		portRange: [7980, 7990]
	},
	log: {
		color: true,
		console: true,
		level: '>= verbose'
	},
	cluster: {
		max: 3
	}
});
gn.start(function () {
	if (!gn.isMaster()) {
		gn.udp.useDecryption(decrypt);
		gn.udp.hook(1, testHook1);
		gn.udp.command(1, 'testCommand1', testCommand1);
		gn.udp.setup(function () {
			console.log('ready');
		});
	} else {
		// master only
		var cipherKey = crypto.randomBytes(CryptoEngine.CIPHER_KEY_LEN);
		var cipherNounce = crypto.randomBytes(CryptoEngine.CIPHER_NOUNCE_LEN);
		var macKey = crypto.randomBytes(CryptoEngine.MAC_KEY_LEN);
		var sessData = {
			cipherKey: cipherKey,
			cipherNounce: cipherNounce,
			macKey: macKey
		};
		fs.writeFileSync(SESS_PATH, JSON.stringify(sessData));
	}
});

function testHook1(state, next) {
	console.log('command hook', state.sessionId, state.seq);
	next();
}

function testCommand1(state) {
	console.log('command', state.payload);
}

function decrypt(buff, cb) {
	var res = ce.getSessionIdAndPayload(buff);
	fs.readFile(SESS_PATH, 'utf8', function (error, data) {
		if (error) {
			return cb(error);
		}
		data = JSON.parse(data);
		try {
			cb(null, res.sessionId, res.seq, ce.decrypt(
				new Buffer(data.cipherKey.data),
				new Buffer(data.cipherNounce.data),
				new Buffer(data.macKey.data),
				res.seq,
				res.payload
			));
		} catch (e) {
			console.error('***Error:', e);
			cb(e);
		}
	});
}

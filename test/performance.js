'use strict';

var assert = require('assert');
var CryptoEngine = require('../lib/packet/cryptoengine');
var uuid = require('../lib/uuid');

describe('gracenode performance tests', function () {

	var cryptoLoop = 10000;

	it('It can run CryptoEngine encrypt and decrypt ' + cryptoLoop + ' times', function () {
		var ce = new CryptoEngine();
		var uid = uuid.v4().toString();
		var c = CryptoEngine.createCipher();
		var seq = 0;
		var text = new Buffer(uid + uid + uid + uid + uid + ':' + Date.now());
		var start = Date.now();
		for (var i = 0; i < cryptoLoop; i++) {
			var encrypted = ce.encrypt(c.cipherKey, c.cipherNonce, c.macKey, seq, text);
			var decrypted = ce.decrypt(c.cipherKey, c.cipherNonce, c.macKey, seq, encrypted);
			seq += 1;
			assert.equal(text.toString(), decrypted.toString());
		}
		console.log('CryptoEngine encryption and decryption', cryptoLoop, 'times took', (Date.now() - start) + 'ms');
	});

	it('It can run CryptoEngine static encrypt and static decrypt ' + cryptoLoop + ' times', function () {
		var ce = CryptoEngine;
		var uid = uuid.v4().toString();
		var c = CryptoEngine.createCipher();
		var seq = 0;
		var text = new Buffer(uid + uid + uid + uid + uid + ':' + Date.now());
		var start = Date.now();
		var sid = 'session-id';
		var src = { cipherKey: c.cipherKey, cipherNonce: c.cipherNonce, macKey: c.macKey };
		for (var i = 0; i < cryptoLoop; i++) {
			var encrypted = ce.encrypt(sid, src, seq, text);
			var decrypted = ce.decrypt(sid, src, seq, encrypted);
			seq += 1;
			assert.equal(text.toString(), decrypted.toString());
		}
		console.log('CryptoEngine encryption and decryption', cryptoLoop, 'times took', (Date.now() - start) + 'ms');
	});

});

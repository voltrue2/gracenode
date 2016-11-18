'use strict';

var assert = require('assert');
var lib = require('../lib/'); 
var CryptoEngine = require('../lib/packet/cryptoengine');
var uuid = require('../lib/uuid');

describe('gracenode performance tests', function () {

	var cryptoLoop = 10000;
	var searchLoop = 100;
	var list = makelist(100000);

	it('can test performance of full scan custom search on ' + list.length + ' list ' + searchLoop + ' times', function () {
		var r = [];
		var min = 0;
		var max = Math.floor(list.length / 4);
		for (var i = 0; i < searchLoop; i++) {
			var s = Date.now();
			var res = [];
			for (var j = 0, jen = list.length; j < jen; j++) {
				if (list[j].id % 4 === 0) {
					res.push(list[j]);
				}
			}
			var e = Date.now();
			r.push(e - s);	
			assert.equal(res.length, max);
		}
		console.log('Custom search by full scan average:', avg(r), ' ms with', max, 'matches');
	});

	it('can test performance of full scan custom search on ' + list.length + ' list ' + searchLoop + ' times', function () {
		var r = [];
		var min = 0;
		var max = Math.floor(list.length / 4);
		var find = function (value) {
			return value.id % 4 === 0;
		};
		for (var i = 0; i < searchLoop; i++) {
			var s = Date.now();
			var res = lib.find(list, find);
			var e = Date.now();
			r.push(e - s);	
			assert.equal(res.length, max);
		}
		console.log('Custom search by lib.find() average:', avg(r), 'ms with', max, 'matches');
	});

	it('can test performance of full scan range search on ' + list.length + ' list ' + searchLoop + ' times', function () {
		var r = [];
		var min = 0;
		var max = Math.floor(list.length / 4);
		for (var i = 0; i < searchLoop; i++) {
			var s = Date.now();
			var res = [];
			for (var j = 0, jen = list.length; j < jen; j++) {
				if (list[j].id >= 0 && list[j].id < max) {
					res.push(list[j]);
				}
			}
			var e = Date.now();
			r.push(e - s);	
			assert.equal(res.length, max);
		}
		console.log('Range search by full scan average:', avg(r), 'ms with', max, 'matches');
	});

	it('can test performance of brange() on ' + list.length + ' list ' + searchLoop + ' times', function () {
		var r = [];
		var min = 0;
		var max = Math.floor(list.length / 4);
		for (var i = 0; i < searchLoop; i++) {
			var s = Date.now();
			var res = lib.brange(list, 'id', min, max - 1);
			var e = Date.now();
			r.push(e - s);	
			assert.equal(res.length, max);
		}
		console.log('Range search by lib.brange() average:', avg(r), 'ms with', max, 'matches');
	});

	it('can test performance of full scan search on ' + list.length + ' list ' + searchLoop + ' times', function () {
		var r = [];
		var m = Math.floor(list.length * 0.8);
		for (var i = 0; i < searchLoop; i++) {
			var s = Date.now();
			var res;
			for (var j = 0, jen = list.length; j < jen; j++) {
				if (list[j].id === m) {
					res = list[j];
					break;
				}
			}
			var e = Date.now();
			r.push(e - s);	
		}
		console.log('Search by full scan average:', avg(r), 'ms');
	});

	it('can test performance of bsearch() on ' + list.length + ' list ' + searchLoop + ' times', function () {
		var r = [];
		var m = Math.floor(list.length * 0.8);
		for (var i = 0; i < searchLoop; i++) {
			var s = Date.now();
			var index = lib.bsearch(list, 'id', m);
			var res = list[index];
			var e = Date.now();
			r.push(e - s);	
		}
		console.log('Search by lib.bsearch() average:', avg(r), 'ms');
	});

	it('can run CryptoEngine encrypt and decrypt ' + cryptoLoop + ' times', function () {
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

	it('can run CryptoEngine static encrypt and static decrypt ' + cryptoLoop + ' times', function () {
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
		console.log('CryptoEngine static encryption and static decryption', cryptoLoop, 'times took', (Date.now() - start) + 'ms');
	});

	function avg(list) {
		var t = 0;
		for (var i = 0, len = list.length; i < len; i++) {
			t += list[i];
		}
		return t / len;
	}

	function makelist(len) {
		var list = [];
		for (var i =  0; i < len; i++) {
			list.push({
				id: i,
				a: i,
				b: i,
				c: i,
				d: i,
				e: i,
				f: i,
				g: i,
				h: i,
				i: i,
				j: i,
				k: i,
				l: i,
				m: i,
				n: i,
				o: i,
				p: i,
				q: i,
				r: i,
				s: i,
				t: i,
				u: i,
				v: i,
				w: i,
				x: i,
				y: i,
				z: i
			});
		}
		return list;
	}

});

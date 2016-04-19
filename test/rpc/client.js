'use strict';

var gn = require('../../src/gracenode');
var sclient = require('./simpleClient');
var req = require('../src/request');

var secure = true;
var ip = process.argv[2];
var httpPort = process.argv[3];
var port = process.argv[4];

var cmd = 1;

gn.config({
	cluster: {
		max: process.argv[5] || 0
	}
});
gn.start(function () {
	sclient.start(ip, port, function (error) {
		if (error) {
			return gn.stop(error);
		}
		req.POST('http://' + ip + ':' + httpPort + '/auth', null, null, function (error, res, st) {
			if (error) {
				return gn.stop(error);
			}
			var cipher = {
				cipherKey: new Buffer(res.cipherData.cipherKey.data),
				cipherNonce: new Buffer(res.cipherData.cipherNonce.data),
				macKey: new Buffer(res.cipherData.macKey.data),
				seq: res.cipherData.seq
			};
			var sid = res.sessionId;
			// RPC response receiver
			var counter = 0;
			var max = 3;
			// RPC send
			for (var i = 0; i < max; i++) {
				sclient.secureReceiver(cipher, function (resp) {
					counter += 1;
					console.log('response:', counter, resp);
					if (max === counter) {
						gn.stop();
					}
				});
				cipher.seq += 1;
				sclient.secureSender(sid, cipher, cmd, cipher.seq, { message: 'Hello ' + i }, function (error) {
					if (error) {
						return gn.stop(error);
					}
					console.log('RPC sent:', i);
				});
			}
		});
	});
});

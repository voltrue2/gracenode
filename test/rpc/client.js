'use strict';

var gn = require('../../src/gracenode');
var sclient = require('./simpleClient');
var req = require('../src/request');

var ip = process.argv[2];
var httpPort = process.argv[3];
var port = process.argv[4];
var max = process.argv[5] || 1;
var cmd = 1;
var interval = 10;

gn.config({
	/*
	log: {
		console: false
	},
	*/
	cluster: {
		max: process.argv[6] || 0
	}
});
gn.start(function () {
	sclient.start(ip, port, function (error) {
		if (error) {
			return gn.stop(error);
		}
		req.POST('http://' + ip + ':' + httpPort + '/auth', null, null, function (error, res) {
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
			var counter = 1;
			// RPC send
			var recv = function (resp) {
				counter += 1;
				console.log('response:', counter, resp);
				if (counter >= max) {
					gn.stop();
				}
			};
			sclient.recv(cipher, recv);
			var sender = function () {
				setTimeout(function () {
					cipher.seq += 1;
					var seq = cipher.seq;
					sclient.secureSender(sid, cipher, cmd, cipher.seq, { message: 'Hello ' + cipher.seq }, function (error) {
						if (error) {
							return gn.stop(error);
						}
						console.log('sent:', seq);
					});
					if (cipher.seq < max) {
						sender();
					} else {
						console.log('done sending');
					}
				}, interval);
			};
			sender();
		});
	});
});

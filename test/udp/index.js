var async = require('../../lib/async');
var logEnabled = require('../arg')('--log');
var request = require('../src/request');
var assert = require('assert');
var gn = require('../../src/gracenode');
var simpleClient = require('./simpleClient');
var transport = require('../../lib/transport');
var portOne = 7980;
var portTwo = 7981;
var portThree = 7983;
var httpPort = 7982;
//var addr = '::0';
var addr = '127.0.0.1';

var cipher;
var sessionId;

// global UDP error handler
gn.udp.onError(function (error) {
	throw error;
});

describe('gracenode.udp', function () {

	it('can setup UDP server w/o session + encryption', function (done) {
		gn.config({
			log: {
				color: true,
				console: logEnabled,
				level: '>= verbose'
			},
			udp: {
				maxPacketSize: 1000,
				address: addr,
				port: portOne
			},
			http: {
				host: 'localhost',
				port: httpPort
			}
		});
		gn.start(done);
	});
	
	it('can get connection info', function () {
		var info = gn.udp.info();
		assert(info.host);
		assert(info.port);
		assert(info.address);
	});

	it('can register a hook function to all commands', function () {
		gn.udp.hook(function all(state, next) {
			state.hookToAll = true;
			next();
		});
	});

	it('can register a hook function to multiple commands', function () {
		gn.udp.hook([0, 1], function many(state, next) {
			state.hookToMany = true;
			next();
		});
	});

	it('can register multiple command handlers', function (done) {
		gn.udp.command(4000, 'manyHandlers', function one(state, next) {
			assert.equal(state.hookToAll, true);
			state.inc = 1;
			next();
		});
		gn.udp.command(4000, 'manyHandlers', function two(state, next) {
			assert.equal(state.hookToAll, true);
			state.inc += 1;
			next();
		});
		gn.udp.command(4000, 'manyHandlers', function three(state, next) {
			assert.equal(state.hookToAll, true);
			state.inc += 1;
			next();
		});
		gn.udp.command(4000, 'manyHandlers', function four(state, next) {
			assert.equal(state.hookToAll, true);
			state.send({ inc: state.inc, message: 'Hello' });
			next();
		});
		simpleClient.receiver(function (msg) {
			assert.equal(msg.inc, 3);
			assert.equal(msg.message, 'Hello');
			done();
		});
		var data = {
			message: 'Hello'
		};
		simpleClient.sender(portOne, 4000, 0, data);
	});

	it('can register UDP command and handle message from client and revieve message from server w/o session + encryption', function (done) {
		var clientMsg = 'Hello';
		var serverMsg = 'Echo';
		gn.udp.command(0, 'command0', function (state) {
			assert.equal(state.payload.message, clientMsg);
			assert.equal(state.hookToMany, true);
			assert.equal(state.hookToAll, true);
			state.send(serverMsg);
		});
		simpleClient.receiver(function (msg) {
			assert.equal(msg, serverMsg);
			done();
		});
		var data = {
			message: clientMsg
		};
		simpleClient.sender(portOne, 0, 0, data);
	});

	it('can register UDP command + hook and handle message from client and revieve message from server w/o session + encryption', function (done) {
		var clientMsg = 'Hello';
		var serverMsg = 'Echo';
		gn.udp.command(1, 'command1', function (state) {
			assert.equal(state.payload.message, clientMsg);
			assert.equal(state.hookPassed, true);
			assert.equal(state.hookToAll, true);
			assert.equal(state.hookToMany, true);
			state.send(serverMsg);
		});
		gn.udp.hook('command1', function (state, next) {
			state.hookPassed = true;
			next();
		});
		simpleClient.receiver(function (msg) {
			assert.equal(msg, serverMsg);
			done();
		});
		var data = {
			message: clientMsg
		};
		simpleClient.sender(portOne, 1, 0, data);
	});

	it('can set up session + encryption/decryption for UDP server and HTTP authentication endpoint', function () {
		gn.session.useUDPSession();
		gn.http.post('/udpauth', function (req, res) {
			gn.session.setHTTPSession(req, res, { msg: 'session data' }, function (error) {
				assert.equal(error, null);
				res.json({
					sessionId: req.args.sessionId,
					address: '0.0.0.0',
					port: portOne,
					cipher: req.args.cipher
				});
			});
		});
	});

	it('can authenticate client via HTTP endpoint and send message from client to server and back server to client w/ session + encryption', function (done) {
		var clientMsg = 'Safe';
		var serverMsg = 'Safe ehco';
		var data = {
			message: clientMsg
		};
		gn.udp.command(2, 'command2', function (state) {
			assert.equal(state.hookToAll, true);
			assert.equal(state.payload.message, clientMsg);
			state.send(serverMsg);
		});
		request.POST('http://localhost:' + httpPort + '/udpauth/', null, null, function (error, res, st) {
			assert.equal(error, null);
			assert.equal(st, 200);
			assert(res.sessionId);
			assert(res.cipher);
			sessionId = res.sessionId;
			cipher = {
				cipherKey: new Buffer(res.cipher.cipherKey),
				cipherNonce: new Buffer(res.cipher.cipherNonce),
				macKey: new Buffer(res.cipher.macKey),
				seq: res.cipher.seq
			};
			cipher.seq += 1;
			simpleClient.secureSender(portOne, sessionId, cipher, 2, res.cipher.seq, data, function () {
				simpleClient.secureReceiver(cipher, function (msg) {
					assert.equal(msg, serverMsg);
					done();
				});
			});
		});
	});

	it('can authenticate client via HTTP endpoint and send message from client to server and back server to client w/ session + encryption and hook', function (done) {
		var clientMsg = 'Safe';
		var serverMsg = 'Safe ehco';
		var data = {
			message: clientMsg
		};
		gn.udp.hook(3, function (state, next) {
			state.hookPassed = true;
			next();
		});
		gn.udp.command(3, 'command3', function (state) {
			assert.equal(state.payload.message, clientMsg);
			assert.equal(state.hookToAll, true);
			assert.equal(state.hookPassed, true);
			state.send(serverMsg);
		});
		request.POST('http://localhost:' + httpPort + '/udpauth/', null, null, function (error, res, st) {
			assert.equal(error, null);
			assert.equal(st, 200);
			assert(res.sessionId);
			assert(res.cipher);
			sessionId = res.sessionId;
			cipher = {
				cipherKey: new Buffer(res.cipher.cipherKey),
				cipherNonce: new Buffer(res.cipher.cipherNonce),
				macKey: new Buffer(res.cipher.macKey),
				seq: res.cipher.seq
			};
			cipher.seq += 1;
			simpleClient.secureSender(portOne, sessionId, cipher, 3, res.cipher.seq, data, function () {
				simpleClient.secureReceiver(cipher, function (msg) {
					assert.equal(msg, serverMsg);
					done();
				});
			});
		});
	});

	it('can set custom session set and get', function () {
		var data = {};
		gn.session.defineSet(function (id, sess, cb) {
			data[id] = sess;
			cb();
		});
		gn.session.defineGet(function (id, cb) {
			if (!data[id]) {
				return cb(new Error('SessionNotFound'));
			}
			cb(null, data[id]);
		});
		gn.session.defineDel(function (id, cb) {
			delete data[id];
			cb();
		});
	});

	it('can repeat client to server secure communication multiple times', function (done) {
		var clientMsg = 'Safe';
		var serverMsg = 'Safe ehco';
		var data = {
			message: clientMsg
		};
		var max = 10;
		var count = 0;
		gn.udp.hook(4, function (state, next) {
			state.hookPassed = true;
			next();
		});
		gn.udp.command(4, 'command4', function (state) {
			assert.equal(state.hookToAll, true);
			assert.equal(state.payload.message, clientMsg);
			assert.equal(state.hookPassed, true);
			state.send(serverMsg);
		});
		request.POST('http://localhost:' + httpPort + '/udpauth/', null, null, function (error, res, st) {
			assert.equal(error, null);
			assert.equal(st, 200);
			assert(res.sessionId);
			assert(res.cipher);
			sessionId = res.sessionId;
			cipher = {
				cipherKey: new Buffer(res.cipher.cipherKey),
				cipherNonce: new Buffer(res.cipher.cipherNonce),
				macKey: new Buffer(res.cipher.macKey),
				seq: res.cipher.seq
			};
			var send = function () {
				cipher.seq += 1;
				simpleClient.secureSender(portOne, sessionId, cipher, 4, res.cipher.seq, data, function () {
					simpleClient.secureReceiver(cipher, function (msg) {
						assert.equal(msg, serverMsg);
						if (count < max) {
							count++;
							return send();
						}
						done();
					});
				});
			};
			send();
		});
	});

	it('can sync seq w/ push', function (done) {
		cipher.seq += 1;
		sendSeq = cipher.seq;
		var time = Date.now();
		gn.udp.command(55, 'sync', function sync(state) {
			state.send({ sync: state.payload.sync });
		});
		simpleClient.secureReceiver(cipher, function (msg, seq) {
			assert.equal(msg.sync, time);
			assert.equal(seq, sendSeq);
			done();
		});
		simpleClient.secureSender(portOne, sessionId, cipher, 55, sendSeq, { sync: time }, function () {
			
		});
	});

	it('can send a server push message to user defined address and port', function (done) {
		var cli = require('dgram').createSocket('udp4');
		var MSG = 'HELLO:' + Date.now();
		cli.on('listening', function () {
			var info = cli.address();
			// send server push
			gn.udp.push(new Buffer(MSG), info.address, info.port);
		});
		cli.on('message', function (msg) {
			var parsed = transport.parse(msg);
			assert.equal(parsed.payloads[0].payload.toString(), MSG);
			done();
		});
		cli.bind({
			address: addr,
			port: portThree,
			exclusive: true
		 });
	});

	it('can send a server push message to multiple user defined address and port', function (done) {
		var MSG = 'HELLO:' + Date.now();
		var list = [];
		var finished = 0;
		var mport = 3000;
		var check = function () {
			if (finished === tasks.length - 1) {
				done();
			}
			finished += 1;
		};
		var ready = function () {
			// send server push
			gn.udp.multipush(new Buffer(MSG), list);
		};
		var createClient = function (next) {
			var cli = require('dgram').createSocket('udp4');
			cli.on('listening', function () {
				list.push(cli.address());
				next();
			});
			cli.on('message', function (msg) {
				var parsed = transport.parse(msg);
				assert.equal(parsed.payloads[0].payload.toString(), MSG);
				check();
			});
			cli.bind({
				address: addr,
				port: mport++,
				exclusive: true
			 });
		};
		var tasks = [ createClient, createClient, createClient ];
		async.series(tasks, ready);
	});
});

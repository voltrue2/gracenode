var logEnabled = require('../arg')('--log');
var request = require('../src/request');
var assert = require('assert');
var gn = require('../../src/gracenode');
var simpleClient = require('./simpleClient');
var portOne = 7980;
var portTwo = 7981;
var httpPort = 7982;
var addr = '::0';

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
				address: addr,
				portRange: [portOne, portTwo]
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
			msg = JSON.parse(msg);
			assert.equal(msg.inc, 3);
			assert.equal(msg.message, 'Hello');
			done();
		});
		var data = {
			command: 4000,
			message: 'Hello'
		};
		simpleClient.sender(portOne, data);
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
			command: 0,
			message: clientMsg
		};
		simpleClient.sender(portOne, data);
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
			command: 1,
			message: clientMsg
		};
		simpleClient.sender(portOne, data);
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
			command: 2,
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
			simpleClient.secureSender(portOne, sessionId, cipher, data, function () {
				simpleClient.secureReceiver(cipher, function (error, msg) {
					assert.equal(error, null);
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
			command: 3,
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
			simpleClient.secureSender(portOne, sessionId, cipher, data, function () {
				simpleClient.secureReceiver(cipher, function (error, msg) {
					assert.equal(error, null);
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
			command: 4,
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
				simpleClient.secureSender(portOne, sessionId, cipher, data, function () {
					simpleClient.secureReceiver(cipher, function (error, msg) {
						assert.equal(error, null);
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
	
});

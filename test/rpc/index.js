var logEnabled = require('../arg')('--log');
var request = require('../src/request');
var assert = require('assert');
var gn = require('../../src/gracenode');
var Client = require('./simpleClient');
var UdpClient = require('../lib/udpclient');
var portOne = 9877;
var portTwo = 9880;
var httpPort = 9899;
var udpPort = 7980;

var client;
var cipher;
var sessionId;

describe('gracenode.rpc', function () {
	
	it('can setup RPC server', function (done) {
		gn.config({
			log: {
				color: true,
				console: logEnabled,
				level: '>= verbose'
			},
			http: {
				host: 'localhost',
				port: httpPort
			},
			rpc: {
				host: 'localhost',
				portRange: [ portOne, portTwo ],
				heartbeat: {
					timeout: 2000,
					checkFrequency: 1000
				}
			},
			udp: {
				address: '127.0.0.1',
				portRange: [ udpPort ]
			}
		});
		gn.start(done);
	});

	it('can get connected host and port of RPC server', function () {
		var info = gn.rpc.info();
		assert(info.host);
		assert(info.port);
	});

	it('can register a hook function to all commands', function () {
		gn.rpc.hook(function all(state, next) {
			state.hookToAll = true;
			next();
		});
	});

	it('can register a hook function to multiple commands', function () {
		gn.rpc.hook([0, 10], function many(state, next) {
			state.hookToMany = true;
			next();
		});
	});

	it('can start client', function (done) {
		client = new Client();
		client.start('localhost', portOne, done);
	});

	it('can register command and handle it w/o secure connection', function (done) {
		var clientMsg = 'Hello';
		var serverMsg = 'Echo';
		var cid = 0;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			assert.equal(state.hookToAll, true);
			assert.equal(state.hookToMany, true);
			assert.equal(state.payload.message, clientMsg);
			cb({ message: serverMsg });
		});
		client.recvOnce(function (data) {
			assert.equal(data.message, serverMsg);
			done();
		});
		client.send(cid, 0, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can register command and handle it and push to cleint after 100msec w/o secure connection', function (done) {
		var clientMsg = 'Hello';
		var serverMsg = 'Echo';
		var pushMsg = 'Push';
		var cid = 10;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			assert.equal(state.hookToAll, true);
			assert.equal(state.hookToMany, true);
			assert.equal(state.payload.message, clientMsg);
			cb({ message: serverMsg });
			setTimeout(function () {
				state.send({message: pushMsg });
			}, 100);
		});
		client.recvOnce(function (data) {
			assert.equal(data.message, serverMsg);
			client.recvOnce(function (data) {
				assert.equal(data.message, pushMsg);
				done();
			});
		});
		client.send(cid, 0, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can register command + hook and handle it w/o secure connection', function (done) {
		var clientMsg = 'Hello';
		var serverMsg = 'Echo';
		var cid = 1;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			assert.equal(state.hookToAll, true);
			assert.equal(state.payload.message, clientMsg);
			assert.equal(state.hookPassed, true);
			cb({ message: serverMsg });
		});
		gn.rpc.hook('command' + cid, function (state, next) {
			state.hookPassed = true;
			next();
		});
		client.recvOnce(function (data) {
			assert.equal(data.message, serverMsg);
			done();
		});
		client.send(cid, 1, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can register command + hook and handle hook error w/o secure connection', function (done) {
		var clientMsg = 'Hello';
		var serverMsg = 'Echo';
		var cid = 2;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			assert.equal(state.hookToAll, true);
			assert.equal(state.payload.message, clientMsg);
			assert.equal(state.hookPassed, true);
			cb({ message: serverMsg });
		});
		gn.rpc.hook(cid, function (state, next) {
			next(new Error('HookError'));
		});
		client.recvOnce(function (data) {
			assert.equal(data.message, 'HookError');
			done();
		});
		client.send(cid, 2, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can setup session + encryption for RPC and HTTP enpoint for authentication', function () {
		gn.session.useRPCSession();
		gn.session.useUDPSession();
		gn.http.post('/rpcauth', function (req, res) {
			gn.session.setHTTPSession(req, res, { msg: 'session data' }, function (error) {
				assert.equal(error, null);
				res.json({
					sessionId: req.args.sessionId,
					cipher: req.args.cipher,
					host: 'localhost',
					port: portOne
				});
			});
		});
	});

	it('can be authenticated by HTTP endpoint', function (done) {
		request.POST('http://localhost:' + httpPort + '/rpcauth/', null, null, function (error, res, st) {
			assert.equal(error, null);
			assert(res.cipher);
			assert(res.sessionId);
			cipher = {
				cipherKey: new Buffer(res.cipher.cipherKey),
				cipherNonce: new Buffer(res.cipher.cipherNonce),
				macKey: new Buffer(res.cipher.macKey),
				seq: res.cipher.seq
			};
			sessionId = res.sessionId;
			done();
		});
	});

	it('can handle secure command w/ session', function (done) {
		var clientMsg = 'Secure Hello';
		var serverMsg = 'Secure Echo';
		var cid = 3;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			assert.equal(state.hookToAll, true);
			assert.equal(state.payload.message, clientMsg);
			cb({ message: serverMsg });
		});
		client.recvOnceSecure(cipher, function (data) {
			assert.equal(data.message, serverMsg);
			done();
		});
		cipher.seq += 1;
		client.sendSecure(sessionId, cipher, cid, cipher.seq, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can handle secure command + hook w/ session', function (done) {
		var clientMsg = 'Secure Hello';
		var serverMsg = 'Secure Echo';
		var cid = 4;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			assert.equal(state.hookToAll, true);
			assert.equal(state.payload.message, clientMsg);
			assert.equal(state.hookPassed, true);
			cb({ message: serverMsg });
		});
		gn.rpc.hook(cid, function (state, next) {
			state.hookPassed = true;
			next();
		});
		client.recvOnceSecure(cipher, function (data) {
			assert.equal(data.message, serverMsg);
			done();
		});
		cipher.seq += 1;
		client.sendSecure(sessionId, cipher, cid, cipher.seq, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can fail secure command hook w/ session', function (done) {
		var clientMsg = 'Secure Hello';
		var serverMsg = 'Secure Echo';
		var errMsg = 'Oops';
		var cid = 5;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			assert.equal(state.hookToAll, true);
			assert.equal(state.payload.message, clientMsg);
			assert.equal(state.hookPassed, true);
			cb({ message: serverMsg });
		});
		gn.rpc.hook(cid, function (state, next) {
			next(new Error(errMsg));
		});
		client.recvOnceSecure(cipher, function (data) {
			assert.equal(data.message, errMsg);
			done();
		});
		cipher.seq += 1;
		client.sendSecure(sessionId, cipher, cid, cipher.seq, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can handle secure command and send push to client after 100msec w/ session', function (done) {
		var clientMsg = 'Secure Hello';
		var serverMsg = 'Secure Echo';
		var pushMsg = 'Secure Push';
		var cid = 30;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			assert.equal(state.hookToAll, true);
			assert.equal(state.payload.message, clientMsg);
			cb({ message: serverMsg });
			setTimeout(function () {
				state.send({ message: pushMsg });
			}, 100);
		});
		client.recvOnceSecure(cipher, function (data) {
			assert.equal(data.message, serverMsg);
			client.recvOnceSecure(cipher, function (data) {
				assert.equal(data.message, pushMsg);
				done();
			});
		});
		cipher.seq += 1;
		client.sendSecure(sessionId, cipher, cid, cipher.seq, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can handle secure command and send push to client after 100msec twice w/ session', function (done) {
		var clientMsg = 'Secure Hello';
		var serverMsg = 'Secure Echo';
		var pushMsg = 'Secure Push';
		var cid = 31;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			assert.equal(state.payload.message, clientMsg);
			cb({ message: serverMsg });
			setTimeout(function () {
				state.send({ message: pushMsg });
				setTimeout(function () {
					state.send({ message: pushMsg });
				}, 100);
			}, 100);
		});
		client.recvOnceSecure(cipher, function (data) {
			assert.equal(data.message, serverMsg);
			client.recvOnceSecure(cipher, function (data) {
				assert.equal(data.message, pushMsg);
				client.recvOnceSecure(cipher, function (data) {
					assert.equal(data.message, pushMsg);
					done();
				});
			});
		});
		cipher.seq += 1;
		client.sendSecure(sessionId, cipher, cid, cipher.seq, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can fail calling incorrect command', function (done) {
		var clientMsg = 'Secure Hello';
		var errMsg = 'NOT_FOUND';
		var cid = 5000;
		client.recvOnceSecure(cipher, function (data) {
			assert.equal(data.message, errMsg);
			done();
		});
		cipher.seq += 1;
		client.sendSecure(sessionId, cipher, cid, cipher.seq, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can send UDP packet that shares the same session as RPC', function (next) {
		gn.udp.command(1000, 'rpcAndUdp', function (state) {
			assert.equal(state.payload.hello, 'Yay');
			state.send({ message: 'Woot' });
		});
		var udpClient = new UdpClient('127.0.0.1', udpPort);
		udpClient.secure(sessionId, cipher);
		udpClient.receiveOnce(function (msg) {
			assert.equal(msg.message, 'Woot');
			next();
		});
		udpClient.send({
			command: 1000,
			hello: 'Yay'
		});
	});

	it('can reply with an error w/ status 2', function (done) {
		var clientMsg = 'Secure Hello';
		var errMsg = 'BAD REQUEST';
		var cid = 5000;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			cb(new Error(errMsg), state.STATUS.BAD_REQ);
		});
		client.recvOnceSecure(cipher, function (data) {
			assert.equal(data.message, errMsg);
			done();
		});
		cipher.seq += 1;
		client.sendSecure(sessionId, cipher, cid, cipher.seq, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can reply with an error w/ status 3', function (done) {
		var clientMsg = 'Secure Hello';
		var errMsg = 'FORBIDDEN';
		var cid = 5001;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			cb(new Error(errMsg), state.STATUS.FORBIDDEN);
		});
		client.recvOnceSecure(cipher, function (data) {
			assert.equal(data.message, errMsg);
			done();
		});
		cipher.seq += 1;
		client.sendSecure(sessionId, cipher, cid, cipher.seq, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can reply with an error w/ status 4', function (done) {
		var clientMsg = 'Secure Hello';
		var errMsg = 'NOT FOUND';
		var cid = 5002;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			assert.equal(state.hookToAll, true);
			cb(new Error(errMsg), state.STATUS.NOT_FOUND);
		});
		client.recvOnceSecure(cipher, function (data) {
			assert.equal(data.message, errMsg);
			done();
		});
		cipher.seq += 1;
		client.sendSecure(sessionId, cipher, cid, cipher.seq, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can reply with an error w/ status 5', function (done) {
		var clientMsg = 'Secure Hello';
		var errMsg = 'ERROR';
		var cid = 5003;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			assert.equal(state.hookToAll, true);
			cb(new Error(errMsg), state.STATUS.ERROR);
		});
		client.recvOnceSecure(cipher, function (data) {
			assert.equal(data.message, errMsg);
			done();
		});
		cipher.seq += 1;
		client.sendSecure(sessionId, cipher, cid, cipher.seq, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can reply with an error w/ status 6', function (done) {
		var clientMsg = 'Secure Hello';
		var errMsg = 'UNAVAILABLE';
		var cid = 5006;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			assert.equal(state.hookToAll, true);
			cb(new Error(errMsg), state.STATUS.UNAVAILABLE);
		});
		client.recvOnceSecure(cipher, function (data) {
			assert.equal(data.message, errMsg);
			done();
		});
		cipher.seq += 1;
		client.sendSecure(sessionId, cipher, cid, cipher.seq, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can send client heartbeat', function (done) {
		client.recvOnceSecure(cipher, function (data) {
			assert.equal(data.message, 'heartbeat');
			assert(data.serverTime);
			done();
		});
		cipher.seq += 1;
		client.sendSecure(sessionId, cipher, 911, cipher.seq, {}, function (error) {
			assert.equal(error, null);
		});
	});

	it('can failed to send w/o incrementing seq client heartbeat', function (done) {
		client.recvOnceSecure(cipher, function (data) {
			assert.equal(data.message, 'closed');
			done();
		});
		client.sendSecure(sessionId, cipher, 911, cipher.seq, {}, function (error) {
			assert.equal(error, null);
		});
	});

	it('can be re-authenticated by HTTP endpoint', function (done) {
		request.POST('http://localhost:' + httpPort + '/rpcauth/', null, null, function (error, res, st) {
			assert.equal(error, null);
			assert(res.cipher);
			assert(res.sessionId);
			cipher = {
				cipherKey: new Buffer(res.cipher.cipherKey),
				cipherNonce: new Buffer(res.cipher.cipherNonce),
				macKey: new Buffer(res.cipher.macKey),
				seq: res.cipher.seq
			};
			sessionId = res.sessionId;
			done();
		});
	});

	it('can reconnect', function (done) {
		client.stop(function () {
			client = new Client();
			client.start('localhost', portOne, done);
		});
	});

	it('can heartbeat-timeout', function (done) {
		var isDone = false;
		gn.rpc.onClosed(function () {
			if (!isDone) {
				isDone = true;
				client.stop(done);
			}
		});
	});

	it('can reconnect', function (done) {
		client.stop(function () {
			client = new Client();
			client.start('localhost', portOne, done);
		});
	});

	it('can be re-authenticated by HTTP endpoint', function (done) {
		request.POST('http://localhost:' + httpPort + '/rpcauth/', null, null, function (error, res, st) {
			assert.equal(error, null);
			assert(res.cipher);
			assert(res.sessionId);
			cipher = {
				cipherKey: new Buffer(res.cipher.cipherKey),
				cipherNonce: new Buffer(res.cipher.cipherNonce),
				macKey: new Buffer(res.cipher.macKey),
				seq: res.cipher.seq
			};
			sessionId = res.sessionId;
			done();
		});
	});

	it('can send a heartbeat from the new authenticated connection', function (done) {
		client.recvOnceSecure(cipher, function (data) {
			assert.equal(data.message, 'heartbeat');
			assert(data.serverTime);
			done();
		});
		cipher.seq += 1;
		client.sendSecure(sessionId, cipher, 911, cipher.seq, {}, function (error) {
			assert.equal(error, null);
		});
	});

	it ('can start another connection', function (done) {
		client = new Client();	
		client.start('127.0.0.1', portOne, done);
	});

	it('try session highjack (use session ID for different connection) and be rejected from the server', function (done) {
		client.recvOnceSecure(cipher, function (data) {
			assert.equal(data.message, 'closed');
			done();
		});
		cipher.seq += 1;
		client.sendSecure(sessionId, cipher, 911, cipher.seq, {}, function (error) {
		});
	});

});

var logEnabled = require('../arg')('--log');
var request = require('../src/request');
var assert = require('assert');
var gn = require('../../src/gracenode');
var Client = require('./simpleClient');
var udpCli = require('../udp/simpleClient');
var portOne = 9877;
var httpPort = 9899;
var udpPort = 7980;

var client;
var client2;
var cipher;
var sessionId;
var addr = '127.0.0.1';
var udpAddr = '::0';

describe('gracenode.rpc', function () {

	udpCli.useBinary();
	
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
				host: addr,
				port: portOne,
				//portRange: [ portOne, portTwo ],
				heartbeat: {
					timeout: 2000,
					checkFrequency: 1000
				},
				pushInterval: 10
			},
			udp: {
				packets: {
					in: 100,
					out: 100
				},
				address: udpAddr,
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

	it('can set custom formatting function for heartbeat', function () {
		gn.rpc.setHeartbeatResponseFormat(function () {
			var data = {
				serverTime: Date.now(),
				formatted: true,
				message: 'heartbeat'
			};
			return new Buffer(JSON.stringify(data));
		});
	});

	it('can register a hook function to all commands', function () {
		gn.rpc.hook(function all(state, next) {
			state.payload = JSON.parse(state.payload);
			state.hookToAll = true;
			assert(state.clientAddress);
			assert(state.clientPort);
			next();
		});
	});

	it('can register a hook function to multiple commands', function () {
		gn.rpc.hook([0, 10], function many(state, next) {
			state.hookToMany = true;
			next();
		});
	});

	it('can start a client and disconnected from server', function (done) {
		gn.rpc.command(7070, '7070', function (state, cb) {
			state.close();
		});
		var cli = new Client();
		cli.onClose = function () {
			done();
		};
		cli.start(addr, portOne, function () {
			cli.send(7070, 0, {}, function (error) {
				assert.equal(error, null);
			});
		});
	});

	it('can start a client and connection-killed from server', function (done) {
		gn.rpc.command(7071, '7071', function (state, cb) {
			state.kill(new Error('killed'));
		});
		var cli = new Client();
		cli.onClose = function () {
			done();
		};
		cli.start(addr, portOne, function () {
			cli.send(7071, 0, {}, function (error) {
				assert.equal(error, null);
			});
		});
	});

	it('can start a client', function (done) {
		client = new Client();
		client.start(addr, portOne, done);
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

	it('can send a response w/ default status OK 1', function (done) {
		var cid = 332;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			cb({ message: 'hello' });
		});
		client.recvOnce(function (data, status) {
			assert.equal(data.message, 'hello');
			assert.equal(status, 1);
			done();
		});
		client.send(cid, 0, {}, function (error) {
			assert.equal(error, null);
		});
	});

	it('can send an error response w/ default status bad request 2', function (done) {
		var cid = 333;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			cb(new Error('boo'));
		});
		client.recvOnce(function (data, status) {
			assert.equal(data.toString(), 'boo');
			assert.equal(status, 2);
			done();
		});
		client.send(cid, 0, {}, function (error) {
			assert.equal(error, null);
		});
	});

	it('can register multiple handlers for a command', function (done) {
		gn.rpc.command(4000, 'multiple', function one(state, next) {
			assert.equal(state.hookToAll, true);
			state.inc = 1;
			next();
		});
		gn.rpc.command(4000, 'multiple', function two(state, next) {
			assert.equal(state.hookToAll, true);
			state.inc += 1;
			next();
		});
		gn.rpc.command(4000, 'multiple', function three(state, next) {
			assert.equal(state.hookToAll, true);
			state.inc += 1;
			next();
		});
		gn.rpc.command(4000, 'multiple', function four(state, cb) {
			assert.equal(state.hookToAll, true);
			state.inc += 1;
			cb({ inc: state.inc, message: state.payload.message });
		});
		client.recvOnce(function (data) {
			assert.equal(data.inc, 4);
			assert.equal(data.message, 'hello');
			done();
		});
		client.send(4000, 0, { message: 'hello' }, function (error) {
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
			assert.equal(data, 'HookError');
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
		request.POST('http://localhost:' + httpPort + '/rpcauth/', null, null, function (error, res) {
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
			cb(new Buffer(JSON.stringify({ message: serverMsg })));
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

	it('can respond using respond() instead of callback', function (done) {
		var msg = 'I am your father!';
		var cid = 111;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			assert.equal(state.hookToAll, true);
			assert.equal(state.payload.message, msg);
			var res = new Buffer(JSON.stringify({ message: msg }));
			cb(res);
			setTimeout(function () {
				state.respond(res);
			}, 50);
		});
		client.recvOnceSecure(cipher, function (data) {
			assert.equal(data.message, msg);
			client.recvOnceSecure(cipher, function (data) {
				assert.equal(data.message, msg);
				done();
			});
		});
		cipher.seq += 1;
		client.sendSecure(sessionId, cipher, cid, cipher.seq, { message: msg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can access command ID from state object in the handler', function (done) {
		var clientMsg = 'Secure Hello';
		var serverMsg = 'Secure Echo';
		var cid = 3;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			assert.equal(state.command, cid);
			assert.equal(state.hookToAll, true);
			assert.equal(state.payload.message, clientMsg);
			cb(new Buffer(JSON.stringify({ message: serverMsg, command: state.command })));
		});
		client.recvOnceSecure(cipher, function (data) {
			assert.equal(data.message, serverMsg);
			assert.equal(data.command, cid);
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
			cb(new Buffer(JSON.stringify({ message: serverMsg })));
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

	it('can send a batched commands and handle them all', function (done) {
		var msg = 'Batched hello';
		var cid1 = 8881;
		var cid2 = 8882;
		var cid3 = 8883;
		var cid4 = 8884;
		gn.rpc.hook([ cid1, cid2, cid3, cid4 ], function (state, next) {
			state.hookPassed = true;
			next();
		});
		gn.rpc.command(cid1, 'command' + cid1, function (state, cb) {
			var m = msg + ':1';
			assert.equal(state.hookToAll, true);
			assert.equal(state.payload, m);
			assert.equal(state.hookPassed, true);
			cb(new Buffer(m));
		});
		gn.rpc.command(cid2, 'command' + cid2, function (state, cb) {
			var m = msg + ':2';
			assert.equal(state.hookToAll, true);
			assert.equal(state.payload, m);
			assert.equal(state.hookPassed, true);
			cb(new Buffer(m));
		});
		gn.rpc.command(cid3, 'command' + cid3, function (state, cb) {
			var m = msg + ':3';
			assert.equal(state.hookToAll, true);
			assert.equal(state.payload, m);
			assert.equal(state.hookPassed, true);
			cb(new Buffer(m));
		});
		gn.rpc.command(cid4, 'command' + cid4, function (state, cb) {
			var m = msg + ':4';
			assert.equal(state.hookToAll, true);
			assert.equal(state.payload, m);
			assert.equal(state.hookPassed, true);
			cb(new Buffer(m));
		});
		cipher.seq += 1;
		client.sendSecure(sessionId, cipher, 911, cipher.seq, {}, function (error) {
			assert.equal(error, null);
			var caught = 0;
			var finished = false;
			var seen = [];
			client.recvSecure(cipher, function (data) {
				if (data && data.message === 'heartbeat') {
					return;
				}
				var m = data.toString();
				if (seen.indexOf(m) === -1 && m === msg + ':1') {
					caught += 1;
					seen.push(m);
				} else if (seen.indexOf(m) === -1 && m === msg + ':2') {
					caught += 1;
					seen.push(m);
				} else if (seen.indexOf(m) === -1 && m === msg + ':3') {
					caught += 1;
					seen.push(m);
				} else if (seen.indexOf(m) === -1 && m === msg + ':4') {
					caught += 1;
					seen.push(m);
				} else {
					throw new Error(data.toString());
				}
				if (caught === 4 && !finished) {
					finished = true;
					client.clearRecv();
					done();
				}
			});
			var dataList = [
				{ command: cid1, seq: cipher.seq += 1, payload: msg + ':1' },
				{ command: cid2, seq: cipher.seq += 1, payload: msg + ':2' },
				{ command: cid3, seq: cipher.seq += 1, payload: msg + ':3' },
				{ command: cid4, seq: cipher.seq += 1, payload: msg + ':4' }
			];
			client.batchSendSecure(sessionId, cipher, dataList, function (error) {
				assert.equal(error, null);
			});
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
			cb(new Buffer(JSON.stringify({ message: serverMsg })));
		});
		gn.rpc.hook(cid, function (state, next) {
			next(new Error(errMsg));
		});
		client.recvOnceSecure(cipher, function (data) {
			assert.equal(data.toString(), errMsg);
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
			cb(new Buffer(JSON.stringify({ message: serverMsg })));
			setTimeout(function () {
				state.send(new Buffer(JSON.stringify({ message: pushMsg })));
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
			cb(new Buffer(JSON.stringify({ message: serverMsg })));
			setTimeout(function () {
				state.send(new Buffer(JSON.stringify({ message: pushMsg })));
				setTimeout(function () {
					state.send(new Buffer(JSON.stringify({ message: pushMsg })));
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
			assert.equal(data, errMsg);
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
			state.send(new Buffer(JSON.stringify({ message: 'Woot' })));
		});
		udpCli.secureReceiver(cipher, function (msg) {
			assert.equal(msg.message, 'Woot');
			next();
		});
		cipher.seq += 1;
		udpCli.secureSender(
			udpPort,
			sessionId,
			cipher,
			1000,
			cipher.seq,
			{ command: 1000, hello: 'Yay' },
		function () {
			//assert.equal(error, null);
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
			assert.equal(data.toString(), errMsg);
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
			assert.equal(data, errMsg);
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
			assert.equal(data, errMsg);
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
			assert.equal(data, errMsg);
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
			assert.equal(data, errMsg);
			done();
		});
		cipher.seq += 1;
		client.sendSecure(sessionId, cipher, cid, cipher.seq, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can require callback and detect callblack not being called on the server', function (done) {
		gn.rpc.requireCallback(500);
		gn.rpc.command(9988, 'mustCallCallback', function (state) {
			
		});
		client.recvOnceSecure(cipher, function (data) {
			done();
		});
		cipher.seq += 1;
		client.sendSecure(sessionId, cipher, 9988, cipher.seq, {}, function () {});
	});

	it('can send client heartbeat', function (done) {
		client.recvOnceSecure(cipher, function (data) {
			assert.equal(data.message, 'heartbeat');
			assert.equal(data.formatted, true);
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
		request.POST('http://localhost:' + httpPort + '/rpcauth/', null, null, function (error, res) {
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
			client.start(addr, portOne, done);
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
			client.start(addr, portOne, done);
		});
	});

	it('can be re-authenticated by HTTP endpoint', function (done) {
		request.POST('http://localhost:' + httpPort + '/rpcauth/', null, null, function (error, res) {
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
			assert.equal(data.formatted, true);
			assert(data.serverTime);
			done();
		});
		cipher.seq += 1;
		client.sendSecure(sessionId, cipher, 911, cipher.seq, {}, function (error) {
			assert.equal(error, null);
		});
	});

	it ('can start another connection', function (done) {
		client2 = new Client();	
		client2.start(addr, portOne, done);
	});

	it('try session hijack (use session ID for different connection) and be rejected from the server', function (done) {
		client2.recvOnceSecure(cipher, function (data) {
			assert.equal(data.message, 'closed');
			client.stop(done);
		});
		cipher.seq += 1;
		client2.sendSecure(sessionId, cipher, 911, cipher.seq, {}, function () {});
	});

	it('Can RPC server detect a client that disappears', function (done) {
		request.POST('http://localhost:' + httpPort + '/rpcauth/', null, null, function (error, res) {
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
			var rogue = new Client();
			rogue.start(addr, portOne, function (error) {
				assert.equal(error, null);
				gn.rpc.onClosed(function () {
					gn.rpc.onClosed(null);
					done();
				});
				var hb = function () {
					try {
						cipher.seq += 1;
						rogue.sendSecure(sessionId, cipher, 911, cipher.seq, {}, function () {
							setTimeout(hb, 500);
						});
					} catch (e) {
						setTimeout(hb, 500);
					}
				};
				hb();
				setTimeout(function () {
					rogue.client = null;
				}, 1000);
			});
		});
	});

});

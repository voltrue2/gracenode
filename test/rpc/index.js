var logEnabled = require('../arg')('--log');
var request = require('../src/request');
var assert = require('assert');
var gn = require('../../src/gracenode');
var client = require('./simpleClient');
var portOne = 9877;
var portTwo = 9880;
var httpPort = 9899;

var ce = new gn.lib.CryptoEngine();
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
				portRange: [ portOne, portTwo ]
			}
		});
		gn.start(done);
	});

	it('can start client', function (done) {
		client.start('localhost', portOne, done);
	});

	it('can register command and handle it w/o secure connection', function (done) {
		var clientMsg = 'Hello';
		var serverMsg = 'Echo';
		var cid = 0;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			assert.equal(state.payload.message, clientMsg);
			cb(null, { message: serverMsg });
		});
		client.receiver(function (data) {
			assert.equal(data.message, serverMsg);
			done();
		});
		client.sender(cid, 0, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can register command and handle it and push to cleint after 100msec w/o secure connection', function (done) {
		var clientMsg = 'Hello';
		var serverMsg = 'Echo';
		var pushMsg = 'Push';
		var cid = 10;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			assert.equal(state.payload.message, clientMsg);
			cb(null, { message: serverMsg });
			setTimeout(function () {
				state.send({message: pushMsg });
			}, 100);
		});
		client.receiver(function (data) {
			assert.equal(data.message, serverMsg);
			client.receiver(function (data) {
				assert.equal(data.message, pushMsg);
				done();
			});
		});
		client.sender(cid, 0, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can register command + hook and handle it w/o secure connection', function (done) {
		var clientMsg = 'Hello';
		var serverMsg = 'Echo';
		var cid = 1;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			assert.equal(state.payload.message, clientMsg);
			assert.equal(state.hookPassed, true);
			cb(null, { message: serverMsg });
		});
		gn.rpc.hook(cid, function (state, next) {
			state.hookPassed = true;
			next();
		});
		client.receiver(function (data) {
			assert.equal(data.message, serverMsg);
			done();
		});
		client.sender(cid, 1, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can register command + hook and handle hook error w/o secure connection', function (done) {
		var clientMsg = 'Hello';
		var serverMsg = 'Echo';
		var cid = 2;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			assert.equal(state.payload.message, clientMsg);
			assert.equal(state.hookPassed, true);
			cb(null, { message: serverMsg });
		});
		gn.rpc.hook(cid, function (state, next) {
			next(new Error('HookError'));
		});
		client.receiver(function (data) {
			assert.equal(data.message, 'HookError');
			done();
		});
		client.sender(cid, 2, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can setup session + encryption for RPC and HTTP enpoint for authentication', function () {
		gn.session.useRPCSession();
		gn.http.post('/rpcauth', function (req, res) {
			gn.session.setHTTPSession(req, res, 'session data', function (error) {
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
		request.POST('http://localhost:' + httpPort + '/rpcauth', null, null, function (error, res, st) {
			assert.equal(error, null);
			assert.equal(st, 200);
			assert(res.cipher);
			assert(res.sessionId);
			cipher = {
				cipherKey: new Buffer(res.cipher.cipherKey),
				cipherNounce: new Buffer(res.cipher.cipherNounce),
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
			assert.equal(state.payload.message, clientMsg);
			cb(null, { message: serverMsg });
		});
		client.secureReceiver(cipher, function (data) {
			assert.equal(data.message, serverMsg);
			done();
		});
		client.secureSender(sessionId, cipher, cid, cipher.seq, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can handle secure command + hook w/ session', function (done) {
		var clientMsg = 'Secure Hello';
		var serverMsg = 'Secure Echo';
		var cid = 4;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			assert.equal(state.payload.message, clientMsg);
			assert.equal(state.hookPassed, true);
			cb(null, { message: serverMsg });
		});
		gn.rpc.hook(cid, function (state, next) {
			state.hookPassed = true;
			next();
		});
		client.secureReceiver(cipher, function (data) {
			assert.equal(data.message, serverMsg);
			done();
		});
		client.secureSender(sessionId, cipher, cid, cipher.seq, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can fail secure command hook w/ session', function (done) {
		var clientMsg = 'Secure Hello';
		var serverMsg = 'Secure Echo';
		var errMsg = 'Oops';
		var cid = 5;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			assert.equal(state.payload.message, clientMsg);
			assert.equal(state.hookPassed, true);
			cb(null, { message: serverMsg });
		});
		gn.rpc.hook(cid, function (state, next) {
			next(new Error(errMsg));
		});
		client.secureReceiver(cipher, function (data) {
			assert.equal(data.message, errMsg);
			done();
		});
		client.secureSender(sessionId, cipher, cid, cipher.seq, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can handle secure command and send push to client after 100msec w/ session', function (done) {
		var clientMsg = 'Secure Hello';
		var serverMsg = 'Secure Echo';
		var pushMsg = 'Secure Push';
		var cid = 30;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			assert.equal(state.payload.message, clientMsg);
			cb(null, { message: serverMsg });
			setTimeout(function () {
				state.send({ message: pushMsg });
			}, 100);
		});
		client.secureReceiver(cipher, function (data) {
			assert.equal(data.message, serverMsg);
			client.secureReceiver(cipher, function (data) {
				assert.equal(data.message, pushMsg);
				done();
			});
		});
		client.secureSender(sessionId, cipher, cid, cipher.seq, { message: clientMsg }, function (error) {
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
			cb(null, { message: serverMsg });
			setTimeout(function () {
				state.send({ message: pushMsg });
				setTimeout(function () {
					state.send({ message: pushMsg });
				}, 100);
			}, 100);
		});
		client.secureReceiver(cipher, function (data) {
			assert.equal(data.message, serverMsg);
			client.secureReceiver(cipher, function (data) {
				assert.equal(data.message, pushMsg);
				client.secureReceiver(cipher, function (data) {
					assert.equal(data.message, pushMsg);
					done();
				});
			});
		});
		client.secureSender(sessionId, cipher, cid, cipher.seq, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can fail to call incoorect command', function (done) {
		var clientMsg = 'Secure Hello';
		var serverMsg = 'Secure Echo';
		var errMsg = 'NOT_FOUND';
		var cid = 5000;
		client.secureReceiver(cipher, function (data) {
			assert.equal(data.message, errMsg);
			done();
		});
		client.secureSender(sessionId, cipher, cid, cipher.seq, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can reply with an error w/ status 2', function (done) {
		var clientMsg = 'Secure Hello';
		var serverMsg = 'Secure Echo';
		var errMsg = 'BAD REQUEST';
		var cid = 5000;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			cb(new Error(errMsg), null, { status: state.STATUS.BAD_REQ });
		});
		client.secureReceiver(cipher, function (data) {
			assert.equal(data.message, errMsg);
			done();
		});
		client.secureSender(sessionId, cipher, cid, cipher.seq, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can reply with an error w/ status 3', function (done) {
		var clientMsg = 'Secure Hello';
		var serverMsg = 'Secure Echo';
		var errMsg = 'FORBIDDEN';
		var cid = 5001;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			cb(new Error(errMsg), null, { status: state.STATUS.FORBIDDEN });
		});
		client.secureReceiver(cipher, function (data) {
			assert.equal(data.message, errMsg);
			done();
		});
		client.secureSender(sessionId, cipher, cid, cipher.seq, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can reply with an error w/ status 4', function (done) {
		var clientMsg = 'Secure Hello';
		var serverMsg = 'Secure Echo';
		var errMsg = 'NOT FOUND';
		var cid = 5002;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			cb(new Error(errMsg), null, { status: state.STATUS.NOT_FOUND });
		});
		client.secureReceiver(cipher, function (data) {
			assert.equal(data.message, errMsg);
			done();
		});
		client.secureSender(sessionId, cipher, cid, cipher.seq, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can reply with an error w/ status 5', function (done) {
		var clientMsg = 'Secure Hello';
		var serverMsg = 'Secure Echo';
		var errMsg = 'ERROR';
		var cid = 5003;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			cb(new Error(errMsg), null, { status: state.STATUS.ERROR });
		});
		client.secureReceiver(cipher, function (data) {
			assert.equal(data.message, errMsg);
			done();
		});
		client.secureSender(sessionId, cipher, cid, cipher.seq, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

	it('can reply with an error w/ status 6', function (done) {
		var clientMsg = 'Secure Hello';
		var serverMsg = 'Secure Echo';
		var errMsg = 'UNAVAILABLE';
		var cid = 5006;
		gn.rpc.command(cid, 'command' + cid, function (state, cb) {
			cb(new Error(errMsg), null, { status: state.STATUS.UNAVAILABLE });
		});
		client.secureReceiver(cipher, function (data) {
			assert.equal(data.message, errMsg);
			done();
		});
		client.secureSender(sessionId, cipher, cid, cipher.seq, { message: clientMsg }, function (error) {
			assert.equal(error, null);
		});
	});

});

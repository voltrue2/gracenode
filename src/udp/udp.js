'use strict';

var gn = require('../gracenode');
var dgram = require('dgram');
// UDP router
var router = require('./router');
// UDP command hooks
var hooks = require('./hooks');

var PORT_IN_USE = 'EADDRINUSE';

var logger;
var config;
var server;
var onErrorHandler;

var cryptoEngine = {
	encrypt: null,
	decrypt: null
};
var connectionInfo = {
	host: null,
	port: null
};

module.exports.info = function () {
	return {
		host: connectionInfo.host,
		port: connectionInfo.port
	};
};

module.exports.setup = function (cb) {
	logger = gn.log.create('UDP');
	config = gn.getConfig('udp');

	if (!gn.isSupportedVersion()) {
		return gn.stop(new Error(
			'UDP server does not support node.js version: ' + process.version
		));
	}

	if (!config || !config.portRange) {
		return cb();
	}
	
	if (!config.address) {
		logger.info('UDP server will listen to all address: 0.0.0.0');
		config.address = '0.0.0.0';
	}

	if (!Array.isArray(config.portRange) || config.portRange.length < 1) {
		logger.error(
			'incorrect port range',
			'(must be an array of 1 elements from smallest to biggest):',
			config.portRange
		);
		throw new Error('<PORT_RANGE_FOR_UDP_SERVER_INCORRECT>');
	}

	router.setup();

	var running = false;
	var ports = [];
	var portIndex = 0;
	var boundPort;

	var done = function () {
		// UDP server is now successfully bound and listening
		boundPort = ports[portIndex];
		// gracenode shutdown task
		gn.onExit(function UDPShutdown(next) {

			if (!running) {
				logger.info(
					'UDP server not running yet [skip]:',
					config.address + ':' + boundPort
				);
				return next();
			}

			logger.info(
				'UDP server closing',
				config.address + ':' + boundPort
			);

			server.close();

			next();
		});

		running = true;
		server.on('message', handleMessage);
		
		var info = server.address();

		connectionInfo.host = info.address;
		connectionInfo.port = info.port;

		logger.info('UDP server started at', info.address + ':' + info.port);
		logger.info('using encryption:', (cryptoEngine.encrypt ? true : false));
		logger.info('using decryption:', (cryptoEngine.decrypt ? true : false));

		cb();
	};
	var listen = function () {
		
		if (server) {
			server.close();
		}

		var port = ports[portIndex];
		logger.verbose('binding to:', config.address + ':' + port);
		// create UDP server
		server = dgram.createSocket('udp4');
		server.on('error', handleError);
		server.on('listening', done);
		server.bind({
			port: port,
			address: config.address,
			// make sure all workers do NOT share the same port
			exclusive: true
		});
	};
	var handleError = function (error) {
		if (error.code === PORT_IN_USE) {
			// try next port in range
			var badPort = ports[portIndex];
			logger.verbose('port is in use:', badPort);
			portIndex += 1;
			if (!ports[portIndex]) {
				// there's no more port in range
				error.message += ' (port:' + badPort + ')';
				return gn.stop(error);
			}
			return listen();
		}
		gn.stop(error);
	};

	var pend = config.portRange[1] || config.portRange[0];

	for (var p = config.portRange[0]; p <= pend; p++) {
		ports.push(p);
	}

	logger.verbose(
		'port range is',
		config.portRange[0],
		'to',
		pend
	);

	listen();
};

module.exports.onError = function (cb) {
	onErrorHandler = cb;
};

module.exports.useEncryption = function (encrypt) {
	if (typeof encrypt !== 'function') {
		throw new Error('EncryptMustBeFunction');
	}
	cryptoEngine.encrypt = encrypt;
};

module.exports.useDecryption = function (decrypt) {
	if (typeof decrypt !== 'function') {
		throw new Error('DecryptMustBeFunction');
	}
	cryptoEngine.decrypt = decrypt;
};

// assign a handler function to a command
module.exports.command = function (cmdId, commandName, handler) {
	router.define(cmdId, commandName, handler);
};

// assign a command hook function
module.exports.hook = function (cmdIdList, handler) {
	if (typeof cmdIdList === 'function') {
		hooks.add(cmdIdList);
		return;
	}
	// cmdIdList can contain command names instead of command IDs
	cmdIdList = router.getIdsByNames(cmdIdList);
	hooks.add(cmdIdList, handler);
};

function handleMessage(buff, rinfo) {

	logger.verbose('message received:', server.address(), buff, 'from:', rinfo);

	if (cryptoEngine.decrypt) {
		logger.info('using decryption for incoming message');
		var info = module.exports.info();
		cryptoEngine.decrypt(
			buff,
			'UDP',
			info.host,
			info.port,
			function (error, sessId, seq, sessData, decrypted) {
				if (error) {
					// this is also the same as session failure
					logger.error('decryption of message failed:', error);
					dispatchOnError(new Error('DecryptionFailed'), rinfo);
					return;
				}
				// assumes the message text to be a JSON
				var msg = JSON.parse(decrypted.toString());
				logger.verbose(
					'decrypted message:',
					'(session ID:' + sessId + ')',
					'(seq:' + seq + ')',
					msg
				);
				// route and execute command
				executeCmd(sessId, seq, sessData, msg, rinfo);
			}
		);
		return;				
	}

	// assumes the message text is a JSON
	var msgText = JSON.parse(buff.toString());

	logger.verbose('message:', msgText);

	executeCmd(null, null, null, msgText, rinfo);
}

function dispatchOnError(error, rinfo) {
	if (typeof onErrorHandler === 'function') {
		onErrorHandler(error, rinfo);
	}
}

function executeCmd(sessionId, seq, sessionData, msg, rinfo) {
	var cmd = router.route(msg);	
	
	if (!cmd) {
		logger.error('command not found:', msg);
		dispatchOnError(new Error('CommandNotFound'), rinfo);
		return;
	}

	logger.info(
		'command routing resolved:',
		'command', cmd.id, cmd.name,
		'session ID', sessionId,
		'seq', seq
	);

	var state = {
		sessionId: sessionId,
		seq: seq,
		session: sessionData,
		clientAddress: rinfo.address,
		clientPort: rinfo.port,
		payload: msg,
		send: function (msg) {
			send(state, msg);
		}
	};

	cmd.hooks(state, function (error) {
		if (error) {
			logger.error(
				'command hook error:', error,
				'command', cmd.id, cmd.name,
				'session ID', sessionId,
				'seq', seq
			);
			dispatchOnError(error, rinfo);
			return;
		}
		cmd.handler(state);
	});
}

function send(state, msg) {

	if (typeof msg === 'object' && !(msg instanceof Buffer)) {
		msg = JSON.stringify(msg);
	}

	var sent = function (error) {
		if (error) {
			logger.error(
				'sending UDP packet failed:',
				error,
				'to:', state.clientAddress + ':' +
				state.clientPort
			);
			var rinfo = {
				address: state.clientAddress,
				port: state.clientPort
			};
			return dispatchOnError(error, rinfo);
		}
		logger.info(
			'UDP packet sent to:',
			state.clientAddress + ':' + state.clientPort
		);
	};

	if (cryptoEngine.encrypt) {
		logger.info('using encryption for server push message');
		cryptoEngine.encrypt(state, msg, function (error, encrypted) {
			if (error) {
				logger.error(
					'encryption of message failed:',
					state.sessionId,
					state.seq,
					error
				);
				var rinfo2 = {
					address: state.clientAddress,
					port: state.clientPort
				};
				return dispatchOnError(new Error('EncryptionFailed'), rinfo2);
			}
			logger.info(
				'send UDP packet to client:',
				'session ID seq message',
				state.sessionId,
				state.seq,
				msg
			);
			server.send(
				encrypted,
				0,
				encrypted.length,
				state.clientPort,
				state.clientAddress,
				sent
			);
		});
		return;
	}

	var data = new Buffer(msg);
	server.send(
		data,
		0,
		data.length,
		state.clientPort,
		state.clientAddress,
		sent
	);
}

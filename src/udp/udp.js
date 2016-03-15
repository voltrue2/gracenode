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

var cryptoEngine = {
	encrypt: null,
	decrypt: null
};

module.exports.setup = function (cb) {
	logger = gn.log.create('UDP');
	config = gn.getConfig('udp');

	if (!config || !config.portRange) {
		return cb();
	}
	
	if (!config.address) {
		logger.info('UDP server will listen to all address: 0.0.0.0');
		config.address = '0.0.0.0';
	}

	if (!Array.isArray(config.portRange) || config.portRange.length < 2) {
		logger.error(
			'incorrect port range',
			'(must be an array of 2 elements from smallest to biggest):',
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
					'UDP server not running yet [skipp]:',
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

		logger.info('UDP server started at', config.address + ':' + boundPort);
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

        for (var p = config.portRange[0]; p <= config.portRange[1]; p++) {
                ports.push(p);
        }

        logger.verbose('port range is', config.portRange[0], 'to', config.portRange[1]);

	listen();
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
	hooks.add(cmdIdList, handler);
};

function handleMessage(buff) {

	logger.verbose('message received:', server.address(), buff);

	if (cryptoEngine.decrypt) {
		logger.info('using decryption for incoming message');
		cryptoEngine.decrypt(buff, function (error, sessionId, seq, decrypted) {
			if (error) {
				return logger.error('decryption of message failed:', error);
			}
			// assumes the message text to be a JSON
			var msg = JSON.parse(decrypted.toString());
			logger.verbose(
				'decrypted message:',
				'(session ID:' + sessionId + ')',
				'(seq:' + seq + ')',
				msg
			);
			// route and execute command
			executeCmd(sessionId, seq, msg);
		});
		return;				
	}

	// assumes the message text is a JSON
	var msgText = buff.toString();

	logger.verbose('message:', msgText);

	executeCmd(null, null, msgText);
}

function executeCmd(sessionId, seq, msg) {
	var cmd = router.route(msg);	
	
	if (!cmd) {
		logger.error('command not found:', msg);
		return;
	}

	logger.info(
		'command routing resolved:',
		'command', cmd.id, cmd.name,
		'session ID', sessionId,
		'seq', seq
	);

	// TODO: add method to push to client etc
	var state = {
		sessionId: sessionId,
		seq: seq,
		payload: msg
	};

	cmd.hooks(state, function (error) {
		if (error) {
			logger.error(
				'command hook error:', error,
				'command', cmd.id, cmd.name,
				'session ID', sessionId,
				'seq', seq
			);
			return;
		}
		cmd.handler(state);
	});
}

/*
function send(sessionId, seq, msg) {
	if (cryptoEngine.encrypt) {
		logger.info('using encryption for server push message');
		cryptoEngine.encrypt(sessionId, seq, msg, function (error, encrypted) {
			if (error) {
				return logger.error(
					'encryption of message failed:',
					sessionId,
					seq,
					error
				);
			}
		});	
	}
}
*/

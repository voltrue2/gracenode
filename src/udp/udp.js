'use strict';

var neti = require('os').networkInterfaces();
var transport = require('../../lib/transport');
var async = require('../../lib/async');
var gn = require('../gracenode');
var dgram = require('dgram');
// UDP router
var router = require('./router');
// UDP command hooks
var hooks = require('./hooks');

var PORT_IN_USE = 'EADDRINUSE';
var UDP_VER = 'udp4';
var IPv6 = 'ipv6';
var IPv4 = 'ipv4';
var IPV6_ADDR_PREFIX = 'fe80';
var LAST_RANGE = 1000;

var ipv6 = false;
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

module.exports.info = function __udpInfo() {
	return {
		address: connectionInfo.address,
		host: connectionInfo.host,
		port: connectionInfo.port,
		family: connectionInfo.family
	};
};

module.exports.setup = function __udpSetup(cb) {
	logger = gn.log.create('UDP');
	config = gn.getConfig('udp');

	if (!gn.isSupportedVersion()) {
		return gn.stop(new Error(
			'UDP server does not support node.js version: ' + process.version
		));
	}

	if (config && config.port) {
		config.portRange = [
			config.port,
			config.port + LAST_RANGE
		];
	}

	if (!config || !config.portRange) {
		return cb();
	}

	// set transport protocol
	if (config.protocol) {
		transport.use(config.protocol);
	}

	// change default max size for packets
	if (config.maxPacketSize) {
		transport.setMaxSize(config.maxPacketSize);
	}

	logger.info('Max packet size:', transport.getMaxPacketSize());
	
	var addrMap = findAddrMap();
	logger.info('Available Addresses:', addrMap);	

	if (config.version && config.version.toLowerCase() === IPv6) {
		ipv6 = true;
		UDP_VER = 'udp6';
	}

	if (!config.address) {
		if (ipv6) {
			config.address = '::0';
		} else {
			config.address = '0.0.0.0';
		}
		logger.info('UDP server is binding to address:', config.address);
	}

	if (isIPv6()) {
		ipv6 = true;
		UDP_VER = 'udp6';
	}

	logger.info('UDP server is using:', UDP_VER);

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

	var done = function __udpSetupDone() {
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

		connectionInfo.address = info.address;
		connectionInfo.host = config.address;
		connectionInfo.port = info.port;
		connectionInfo.family = info.family;
		
		logger.info('UDP server started at', info.address + ':' + info.port, connectionInfo.family);
		logger.info('using encryption:', (cryptoEngine.encrypt ? true : false));
		logger.info('using decryption:', (cryptoEngine.decrypt ? true : false));

		cb();
	};
	var listen = function __udpSetupListen() {
		
		if (server) {
			server.close();
		}

		var port = ports[portIndex];
		logger.verbose('binding to:', config.address + ':' + port);
		// create UDP server
		server = dgram.createSocket(UDP_VER);
		server.on('error', handleError);
		server.on('listening', done);
		server.bind({
			port: port,
			address: config.address,
			// make sure all workers do NOT share the same port
			exclusive: true
		});
	};
	var handleError = function __udpHandleError(error) {
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

module.exports.onError = function __udpOnError(cb) {
	onErrorHandler = cb;
};

module.exports.useEncryption = function __udpUseEncryption(encrypt) {
	if (typeof encrypt !== 'function') {
		throw new Error('EncryptMustBeFunction');
	}
	cryptoEngine.encrypt = encrypt;
};

module.exports.useDecryption = function __udpUseDecryption(decrypt) {
	if (typeof decrypt !== 'function') {
		throw new Error('DecryptMustBeFunction');
	}
	cryptoEngine.decrypt = decrypt;
};

// assign a handler function to a command
module.exports.command = function __udpCommand(cmdId, commandName, handler) {
	router.define(cmdId, commandName, handler);
};

// assign a command hook function
module.exports.hook = function __udpHook(cmdIdList, handler) {
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

	if (rinfo.port <= 0 || rinfo.port > 65536) {
		logger.error('malformed packet received from invalid port (packet ignored):', rinfo, buff);
		return;
	}

	var parsed = transport.parse(buff);
	if (parsed instanceof Error) {
		logger.error(parsed);
		dispatchOnError(parsed);
		return;
	}

	logger.verbose('parsed packet :', parsed);

	if (cryptoEngine.decrypt) {
		logger.verbose('using decryption for incoming message');
		var toDecrypt = transport.isJson() ? buff : parsed.payload;
		cryptoEngine.decrypt(
			toDecrypt,
			gn.session.PROTO.UDP,
			rinfo.address,
			rinfo.port,
			function __udpHandleMessageOnDecrypt(
					error,
					sessId,
					seq,
					sessData,
					decrypted
				) {
				if (error) {
					// this is also the same as session failure
					logger.error('decryption of message failed:', error);
					dispatchOnError(new Error('DecryptionFailed'), rinfo);
					return;
				}
				logger.verbose(
					'decrypted message:',
					'(session ID:' + sessId + ')',
					'(seq:' + seq + ')',
					decrypted
				);
				parsed.payload = decrypted;
				// route and execute command
				executeCmd(sessId, seq, sessData, parsed, rinfo);
			}
		);
		return;				
	}

	executeCmd(null, parsed.seq, null, parsed, rinfo);
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

	logger.debug(
		'command routing resolved:',
		'command', cmd.id, cmd.name,
		'command handlers', cmd.handlers,
		'session ID', sessionId,
		'seq', seq
	);

	var payload;
	try {
		payload = JSON.parse(msg.payload);
	} catch (e) {
		payload = msg.payload;
	}

	var state = {
		status: transport.STATUS,
		sessionId: sessionId,
		seq: seq,
		session: sessionData,
		clientAddress: rinfo.address,
		clientPort: rinfo.port,
		payload: payload,
		send: function __udpSend(msg, status) {
			send(state, msg, seq, status);
		}
	};

	cmd.hooks(state, function __udpHandleMessageOnHooks(error) {
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
		executeCommands(cmd, state);
	});
}

function executeCommands(cmd, state) {
	var id = cmd.id;
	var name = cmd.name;
	var handlers = cmd.handlers;
	var done = function __udpExecuteCommandsDone(error) {
		if (error) {
			logger.error(
				'command(s) executed with an error:',
				error
			);
			return;
		}
		logger.verbose(
			'command(s) exeuted: (' + id + ':' + name + ')',
			'state:',
			state
		);
	};
	async.eachSeries(handlers, function __udpExecuteCommandEach(handler, next) {
		logger.verbose(
			'executing command:',
			'(' + id + ':' + name + ')',
			(handler.name || 'anonymous'),
			'state:',
			state
		);
		handler(state, next);
	}, done);
}

function send(state, msg, seq, status) {
	// consider this as a reply
	if (status !== undefined) {
		msg = transport.createReply(status, seq || 0, msg);
	} else {
		// otherwise push
		msg = transport.createPush(seq || 0, msg);
	}

	var sent = function __udpSendDone(error) {
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
		logger.verbose(
			'UDP packet sent to:',
			state.clientAddress + ':' + state.clientPort,
			msg
		);
	};

	if (cryptoEngine.encrypt) {
		logger.verbose('using encryption for server push message');
		cryptoEngine.encrypt(state, msg, function __udpOnEncrypt(error, encrypted) {
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
			logger.verbose(
				'send UDP packet to client:',
				'session ID seq message',
				state.sessionId,
				state.seq,
				msg
			);
			try {
				server.send(
					encrypted,
					0,
					encrypted.length,
					state.clientPort,
					state.clientAddress,
					sent
				);
			} catch (e) {
				logger.error('send failed:', e);
			}
		});
		return;
	}

	try {
		server.send(
			msg,
			0,
			msg.length,
			state.clientPort,
			state.clientAddress,
			sent
		);
	} catch (e) {
		logger.error('send failed:', e);
	}
}

function isIPv6() {
	return config.address === '::0' || config.address.indexOf(IPV6_ADDR_PREFIX) === 0;
}

function findAddrMap() {
	var map = {
		ipv4: [],
		ipv6: []
	};
	for (var interfaceName in neti) {
		var list = neti[interfaceName];
		for (var i = 0, len = list.length; i < len; i++) {
			var fam = list[i].family.toLowerCase();
			var addr = list[i].address;
			if (fam === IPv6 && addr.indexOf(IPV6_ADDR_PREFIX) === 0) {
				map.ipv6.push(addr + '%' + interfaceName);
			} else if (fam === IPv4) {
				map.ipv4.push(addr);
			}
		}
	}
	return map;
}

'use strict';

const neti = require('os').networkInterfaces();
const transport = require('../../lib/transport');
const async = require('async');
const gn = require('../gracenode');
const dgram = require('dgram');
// UDP router
const router = require('./router');
// UDP command hooks
const hooks = require('./hooks');

const CLEAN_INTERVAL = 60000;
// configurable
const PACKET_NUM_LIMIT = 10;
const PORT_IN_USE = 'EADDRINUSE';
const IPv6 = 'ipv6';
const IPv4 = 'ipv4';
const IPV6_ADDR_PREFIX = 'fe80';
const LAST_RANGE = 1000;
const clientMap = {};

var udpVersion = 'udp4';
var ipv6 = false;
var logger;
var config;
var server;
var lastCleaned;
var onErrorHandler;
var shutdown = false;

const cryptoEngine = {
	encrypt: null,
	decrypt: null
};
const connectionInfo = {
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

	// we update this at every clean up and use this as TTL for each udp client
	lastCleaned = gn.lib.now();

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

	if (!config.packets) {
		config.packets = PACKET_NUM_LIMIT;
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
	
	const addrMap = findAddrMap();
	logger.info('Available Addresses:', addrMap);	

	if (config.version && config.version.toLowerCase() === IPv6) {
		ipv6 = true;
		udpVersion = 'udp6';
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
		udpVersion = 'udp6';
	}

	logger.info('UDP server is using:', udpVersion);

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
	const ports = [];
	var portIndex = 0;
	var boundPort;

	const done = function __udpSetupDone() {
		// UDP server is now successfully bound and listening
		boundPort = ports[portIndex];
		// gracenode shutdown task
		gn.onExit(function UDPShutdown(next) {

			shutdown = true;

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
		
		const info = server.address();

		connectionInfo.address = info.address;
		connectionInfo.host = config.address;
		connectionInfo.port = info.port;
		connectionInfo.family = info.family;
	
		setupCleaning();
	
		logger.info('UDP server started at', info.address + ':' + info.port, connectionInfo.family);
		logger.info('using encryption:', (cryptoEngine.encrypt ? true : false));
		logger.info('using decryption:', (cryptoEngine.decrypt ? true : false));

		cb();
	};
	const listen = function __udpSetupListen() {
		
		if (server) {
			server.close();
		}

		const port = ports[portIndex];
		logger.verbose('binding to:', config.address + ':' + port);
		// create UDP server
		server = dgram.createSocket(udpVersion);
		server.on('error', handleError);
		server.on('listening', done);
		server.bind({
			port: port,
			address: config.address,
			// make sure all workers do NOT share the same port
			exclusive: true
		});
	};
	const handleError = function __udpHandleError(error) {
		if (error.code === PORT_IN_USE) {
			// try next port in range
			const badPort = ports[portIndex];
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

	const pend = config.portRange[1] || config.portRange[0];

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

module.exports.getCommandList = function () {
	return router.getCommandList();
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

// send server push UDP message to user defined address and port
// msg must be a buffer
module.exports.push = function (msg, address, port, cb) {
	serverPush(msg, address, port, cb);
};

// send server push UDP message to multiple users
// msg must be a buffer
// list = [ { address, port } { ... } ];
module.exports.multipush = function (msg, list, cb) {
	const sender = function __multipushUdpSender () {
		const dest = list.shift();
		if (dest) {
			module.exports.push(msg, dest.address, dest.port, next);
			return;
		}
		// done
		if (typeof cb === 'function') {
			cb();
		}
	};
	const next = function __multipushUdpNext() {
		setImmediate(sender);
	};
	next();
};

function handleMessage(buff, rinfo) {

	if (rinfo.port <= 0 || rinfo.port > 65536) {
		logger.error('malformed packet received from invalid port (packet ignored):', rinfo, buff);
		return;
	}

	const key = rinfo.address + rinfo.port;

	if (!clientMap[key]) {
		clientMap[key] = {
			time: 0
		};
	}
	clientMap[key].time = lastCleaned;

	const parsed = transport.parse(buff);
	if (parsed instanceof Error) {
		logger.error(parsed);
		dispatchOnError(parsed);
		return;
	}

	const pudp = gn.session.PROTO.UDP;
	const dec = cryptoEngine.decrypt;
	const addr = rinfo.address;
	const port = rinfo.port;
	async.eachSeries(parsed.payloads, function __udpHandleMessageEach(payloadData, next) {
		if (dec) {
			var toDecrypt = buff;
			if (!transport.isJson()) {
				toDecrypt = payloadData.payload;
			}
			dec(toDecrypt, pudp, addr, port, function (error, sid, seq, sdata, dec) {
				if (error) {
					// this is also the same as session failure
					logger.error('decryption of message failed:', error);
					dispatchOnError(new Error('DecryptionFailed'), rinfo);
					return;
				}
				payloadData.payload = dec;
				// route and execute command
				executeCmd(sid, seq, sdata, payloadData, rinfo);
				next();
			});
			return;
		}
		executeCmd(null, payloadData.seq, null, payloadData, rinfo);
		next();
	}, nothing);
}

function nothing() {

}

function dispatchOnError(error, rinfo) {
	if (typeof onErrorHandler === 'function') {
		onErrorHandler(error, rinfo);
	}
}

function executeCmd(sessionId, seq, sessionData, msg, rinfo) {
	const cmd = router.route(msg);	
	
	if (!cmd) {
		logger.error('command not found:', msg);
		dispatchOnError(new Error('CommandNotFound'), rinfo);
		return;
	}

	var payload;
	try {
		payload = JSON.parse(msg.payload);
	} catch (e) {
		payload = msg.payload;
	}

	const state = {
		STATUS: transport.STATUS,
		sessionId: sessionId,
		seq: seq,
		session: sessionData,
		clientAddress: rinfo.address,
		clientPort: rinfo.port,
		payload: payload,
		send: function __udpSend(msg, status, cb) {
			send(state, msg, seq, status, cb);
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
	const handlers = cmd.handlers;
	async.eachSeries(handlers, function __udpExecuteCommandEach(handler, next) {
		handler(state, next);
	}, nothing);
}

function send(state, msg, seq, status, cb) {

	if (shutdown) {
		return;
	}

	// consider this as a reply
	if (status !== undefined && status !== null) {
		msg = transport.createReply(status, seq || 0, msg);
	} else {
		// otherwise push
		msg = transport.createPush(seq || 0, msg);
	}

	const sent = function __udpSendDone(error) {
		if (error) {
			logger.error(
				'sending UDP packet failed:',
				error,
				'to:', state.clientAddress + ':' +
				state.clientPort
			);
			const rinfo = {
				address: state.clientAddress,
				port: state.clientPort
			};
			if (typeof cb === 'function') {
				cb(error);
			}
			return dispatchOnError(error, rinfo);
		}
		if (typeof cb === 'function') {
			cb();
		}
	};

	if (cryptoEngine.encrypt) {
		cryptoEngine.encrypt(state, msg, function __udpOnEncrypt(error, encrypted) {
			if (error) {
				logger.error(
					'encryption of message failed:',
					state.sessionId,
					state.seq,
					error
				);
				const rinfo2 = {
					address: state.clientAddress,
					port: state.clientPort
				};
				return dispatchOnError(new Error('EncryptionFailed'), rinfo2);
			}
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

function serverPush(msg, address, port, cb) {

	if (shutdown) {
		return;
	}

	try {
		if (typeof cb !== 'function') {
			cb = function () {};
		}
		msg = transport.createPush(0, msg);
		server.send(msg, 0, msg.length, port, address, cb);
	} catch (e) {
		cb(e);
	}
}

function isIPv6() {
	return config.address === '::0' || config.address.indexOf(IPV6_ADDR_PREFIX) === 0;
}

function findAddrMap() {
	const map = {
		ipv4: [],
		ipv6: []
	};
	for (var interfaceName in neti) {
		const list = neti[interfaceName];
		for (var i = 0, len = list.length; i < len; i++) {
			const fam = list[i].family.toLowerCase();
			const addr = list[i].address;
			if (fam === IPv6 && addr.indexOf(IPV6_ADDR_PREFIX) === 0) {
				map.ipv6.push(addr + '%' + interfaceName);
			} else if (fam === IPv4) {
				map.ipv4.push(addr);
			}
		}
	}
	return map;
}

function setupCleaning() {
	const clean = function () {
		try {
			lastCleaned = gn.lib.now();
			const now = lastCleaned - CLEAN_INTERVAL;
			for (const key in clientMap) {
				if (now >= clientMap[key].time) {
					delete clientMap[key];
				}
			}
		} catch (err) {
			// do nothing
		}
		setTimeout(clean, CLEAN_INTERVAL);
	};
	setTimeout(clean, CLEAN_INTERVAL);
}


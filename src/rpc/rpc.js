'use strict';

const net = require('net');
const gn = require('../gracenode');

const connection = require('./connection');
const router = require('./router');
const hooks = require('./hooks');
const protocol = require('../../lib/packet/protocol');

var logger;
var config;
const cryptoEngine = {
	encrypt: null,
	decrypt: null
};
var formatFunction;
var shutdown = false;
var server;
var connectionCount = 0;

const MAX_LISTENERS = 6000;
const PORT_IN_USE = 'EADDRINUSE';
const TIMEOUT_FOR_CLOSE = 5000;
const HEARTBEAT_ID =  911;
const HEARTBEAT_NAME = 'heartbeat';
const LAST_RANGE = 1000;
const connectionInfo = {
	host: null,
	port: null,
	family: null
};

module.exports.info = function __rpcInfo() {
	return {
		address: connectionInfo.address,
		host: connectionInfo.host,
		port: connectionInfo.port,
		family: connectionInfo.family
	};
};

module.exports.shutdown = function () {
	return shutdown;
};

module.exports.setup = function __rpcSetup(cb) {
	logger = gn.log.create('RPC');
	config = gn.getConfig('rpc');

	connection.setup();

	if (!gn.isSupportedVersion()) {
		return gn.stop(new Error(
			'RPC server does not support node.js version: ' + process.version
		));
	}

	protocol.setup(gn);

	if (config && config.port) {
		config.portRange = [
			config.port,
			config.port + LAST_RANGE
		];
	}

	if (!config || !config.host || !config.portRange) {
		return cb();
	}
	
	if (!Array.isArray(config.portRange) || config.portRange.length < 1) {
		logger.error(
			'incorrect port range',
			'(must be an array of 1 elements from smallest to biggest):',
			config.portRange
		);
		throw new Error('<PORT_RANGE_FOR_RPC_SERVER_INCORRECT>');
	}

	// set up RPC command controller router
	router.setup();
	
	const ports = [];
	var portIndex = 0;
	var boundPort;
	const pend = config.portRange[1] || config.portRange[0];

	for (var p = config.portRange[0]; p <= pend; p++) {
		ports.push(p);
	}

	logger.verbose('port range is', config.portRange[0], 'to', pend);

	const done = function __rpcSetupDone() {
		// RPC server is now successfully bound and listening
		boundPort = ports[portIndex];
		// gracenode shutdown task
		gn.onExit(function RPCShutdown(next) {
			shutdown = true;
			logger.info(
				'RPC server closing',
				config.host + ':' + boundPort,
				'waiting for all open connections to close...'
			);
			logger.info(
				'RPC server will forcefully close if all connections do not close in',
				TIMEOUT_FOR_CLOSE, 'msc'
			);
			// set up time out if connections do not close within the time, it hard closes
			const timeout = setTimeout(next, TIMEOUT_FOR_CLOSE);
			// instruct all connections to close
			closeAllConnections(function () {
				// stop accepting new connections and shutdown when all connections are closed
				server.close(function () {
					clearTimeout(timeout);
					next();
				});
			});
		});

		const info = server.address();
		connectionInfo.address = info.address;
		connectionInfo.host = config.host;
		connectionInfo.port = boundPort;
		connectionInfo.family = info.family;

		// if heartbeat is required, set it up here now
		if (gn.getConfig('rpc.heartbeat')) {
			/*
			rpc.heartbeat: {
				timeout: [milliseconds] // time to timeout and disconnect w/o heartbeat from client,
				checkFrequency: [milliseconds] // heartbeat check internval
			}
			*/
			try {
				router.define(HEARTBEAT_ID, HEARTBEAT_NAME, function __rpcOnHeartbeat(state, cb) {
					handleHeartbeat(state, cb);
				});
			} catch (e) {
				logger.warn(e);
			}
		}	
	
		connection.useCryptoEngine(cryptoEngine);

		logger.info('RPC server started at', config.host + ':' + boundPort, connectionInfo.family);
		logger.info('using encryption:', (cryptoEngine.encrypt ? true : false));
		logger.info('using decryption:', (cryptoEngine.decrypt ? true : false));

		cb();
	};	
	const listen = function __rpcListen() {
		const port = ports[portIndex];
		logger.verbose('binding to:', config.host + ':' + port);
		server.listen({
			port: port,
			host: config.host,
			// make sure all workers do NOT share the same port
			exclusive: true
		});
	};
	server = net.createServer(handleConn);
	server.setMaxListeners(MAX_LISTENERS);
	server.on('listening', done);
	server.on('error', function __rpcOnError(error) {
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
		// different error, stop gracenode
		gn.stop(error);
	});
	// start listening
	listen();
};

module.exports.useEncryption = function __rpcUseEncryption(encrypt) {
	if (typeof encrypt !== 'function') {
		throw new Error('EncryptMustBeFunction');
	}
	cryptoEngine.encrypt = encrypt;
};

module.exports.useDecryption = function __rpcUseDecryption(decrypt) {
	if (typeof decrypt !== 'function') {
		throw new Error('DecryptMustBeFunction');
	}
	cryptoEngine.decrypt = decrypt;
};

// assign a handler function to a command
module.exports.command = function __rpcCommand(cmdId, commandName, handler) {
	router.define(cmdId, commandName, handler);	
};

// assign a command hook function
module.exports.hook = function __rpcHook(cmdIdList, handler) {
	if (typeof cmdIdList === 'function') {
		hooks.add(cmdIdList);
		return;
	}
	// cmdIdList can contain command names instead of command IDs
	cmdIdList = router.getIdsByNames(cmdIdList);
	hooks.add(cmdIdList, handler);
};

module.exports.onClosed = function __rpcOnClosed(func) {
	module.exports._onClosed = func;
};

module.exports.onKilled = function __rpcOnKilled(func) {
	module.exports._onKilled = func;
};

module.exports._onClosed = function __rpcOnClosedExec() {

};

module.exports._onKilled = function __rpcOnKilledExec() {

};

module.exports.setHeartbeatResponseFormat = function __rpcSetHeartbeatResFormat(_formatFunction) {
	if (typeof _formatFunction !== 'function') {
		throw new Error('RPCHeartbeatFormatFunctionMustBeAFunction');
	}
	formatFunction = _formatFunction;
};

function handleHeartbeat(state, cb) {
	if (formatFunction) {
		const formatted = formatFunction(res);
		if (formatted) {
			return cb(formatted);
		}
	}
	var res = new Buffer(JSON.stringify({
		message: 'heartbeat',
		serverTime: Date.now()
	}));
	cb(res);
}

function handleConn(sock) {
	if (sock.remotePort <= 0 || sock.remotePort > 65536) {
		logger.error(
			'invalid and/or malformed incoming TCP packet:',
			sock.remoteAddress, sock.remotePort,
			'kill connection'
		);
		sock.destory();
		return;	
	}
	var conn = connection.create(server, sock);
	conn.on('clear', onConnectionClear);

	connectionCount += 1;

	logger.debug(
		'new TCP connection (id:', conn.id, ') from:',
		sock.remoteAddress, ':', sock.remotePort,
		connectionCount, 'open connections'
	);
}

function onConnectionClear(killed, connId) {
	try {
		if (killed) {
			if (typeof module.exports._onKilled === 'function') {
				module.exports._onKilled(connId);
			}
		} else {
			if (typeof module.exports._onClosed === 'function') {
				module.exports._onClosed(connId);
			}
		}
	} catch (error) {
		logger.error('RPC server failed to handle clearing TCP connection object:', error);
	}
	connectionCount -= 1;
	if (connectionCount < 0) {
		connectionCount = 0;
	}
	logger.debug('remaining open TCP connections:', connectionCount);
}

function closeAllConnections(cb) {
	server.emit('shutdown');
	const POLL_INTERVAL = 100;
	const poll = function () {
		logger.info('closing TCP connections for shutting down the server:', connectionCount, 'connections open');
		if (connectionCount === 0) {
			// all connections have closed
			return cb();
		}
		setTimeout(poll, POLL_INTERVAL);
	};
	setTimeout(poll, POLL_INTERVAL);
}


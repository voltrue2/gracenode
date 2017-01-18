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
const connections = {};

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
	config.cleanInterval = config.cleanInterval || 10000;

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
		// set up time-based cleaning for timed out connections
		setupCleanTimedoutConnections();
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
	const server = net.createServer(handleConn);
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
	var res = new Buffer(JSON.stringify({
		message: 'heartbeat',
		serverTime: Date.now()
	}));
	if (formatFunction) {
		const formatted = formatFunction(res);
		if (formatted) {
			res = formatted;
		}
	}
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
	var conn = connection.create(sock);
	conn.useCryptoEngine(cryptoEngine);
	conn.on('clear', function __rpcOnConnClear(killed) {
		if (conn) {
			if (killed) {
				if (typeof module.exports._onKilled === 'function') {
					module.exports._onKilled(conn.id);
				}
			} else {
				if (typeof module.exports._onClosed === 'function') {
					module.exports._onClosed(conn.id);
				}
			}
			delete connections[conn.id];
		}
		conn = null;
	});

	logger.debug('new TCP connection (id:' + conn.id + ') from:', sock.remoteAddress + ':' + sock.remotePort);

	connections[conn.id] = conn;
}

function closeAllConnections(cb) {
	var counter = 0;
	const len = Object.keys(connections).length;
	logger.info('Closing all open TCP connections:', len, 'open');
	if (len === 0) {
		return cb();
	}
	const count = function () {
		counter += 1;
		logger.info('Connection closed:', counter + '/' + len);
		if (counter === len) {
			cb();
		}
	};
	for (const id in connections) {
		const conn = connections[id];
		conn.once('clear', count);
		logger.info('Closing TCP connection:', id, counter + '/' + len);
		conn.close();
	}
}

function setupCleanTimedoutConnections() {
	const clean = function __rpcCleanTimedoutConns() {
		if (shutdown) {
			for (const i in connections) {
				connections[i].kill();
				delete connections[i];
			}
			return;
		}
		try {
			// we search for start to end so that we iterate 1/2 times!
			const ids = Object.keys(connections);
			const idlen = ids.length;
			var left = 0;
			var right = idlen - 1;
			const middle = idlen / 2 | 0;
			while (left <= middle && right >= middle) {
				var conn = connections[ids[left]];
				if (conn && conn.isTimedout()) {
					conn.kill(new Error('TimedOutConnection'));
					delete connections[ids[left]];
					logger.debug('timed out connection cleaned:', conn.id);
					conn = null;
				}
				if (left === right) {
					break;
				}
				conn = connections[ids[right]];
				if (conn && conn.isTimedout()) {
					conn.kill(new Error('TimedOutConnection'));
					delete connections[ids[right]];
					logger.debug('timed out connection cleaned:', conn.id);
					conn = null;
				}
				left += 1;
				right -= 1;
			}
		} catch (e) {
			logger.error('clean timed out connections:', e);
		}
		setTimeout(clean, config.cleanInterval);
	};
	setTimeout(clean, config.cleanInterval);
}

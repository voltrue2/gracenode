'use strict';

var net = require('net');
var gn = require('../gracenode');

var Connection = require('./connection');
var router = require('./router');
var hooks = require('./hooks');
var protocol = require('../../lib/packet/protocol');
var events = require('events');
var emitter = new events.EventEmitter(); 

var logger;
var config;
var cryptoEngine = {
	encrypt: null,
	decrypt: null
};
var formatFunction;

var PORT_IN_USE = 'EADDRINUSE';
var TIMEOUT_FOR_CLOSE = 5000;
var HEARTBEAT = {
	ID: 911,
	NAME: 'heartbeat'
};
var LAST_RANGE = 1000;
var connectionInfo = {
	host: null,
	port: null,
	family: null
};

module.exports.info = function () {
	return {
		address: connectionInfo.address,
		host: connectionInfo.host,
		port: connectionInfo.port,
		family: connectionInfo.family
	};
};

module.exports.setup = function (cb) {
	logger = gn.log.create('RPC');
	config = gn.getConfig('rpc');

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
	
	var ports = [];
	var portIndex = 0;
	var boundPort;
	var pend = config.portRange[1] || config.portRange[0];

	for (var p = config.portRange[0]; p <= pend; p++) {
		ports.push(p);
	}

	logger.verbose('port range is', config.portRange[0], 'to', pend);

	var done = function () {
		// RPC server is now successfully bound and listening
		boundPort = ports[portIndex];
		// gracenode shutdown task
		gn.onExit(function RPCShutdown(next) {
			logger.info(
				'RPC server closing',
				config.host + ':' + boundPort,
				'waiting for all open connections to close...'
			);

			// instruct all connections to close
			emitter.emit('close');

			// set up time out if connections do not close within the time, it hard closes
			setTimeout(next, TIMEOUT_FOR_CLOSE);
			logger.info(
				'RPC server will forcefully close if all connections do not close in',
				TIMEOUT_FOR_CLOSE, 'msc'
			);

			// stop accepting new connections and shutdown when all connections are closed
			server.close(next);
		});

		var info = server.address();
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
				router.define(HEARTBEAT.ID, HEARTBEAT.NAME, function (state, cb) {
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
	var listen = function () {
		var port = ports[portIndex];
		logger.verbose('binding to:', config.host + ':' + port);
		server.listen({
			port: port,
			host: config.host,
			// make sure all workers do NOT share the same port
			exclusive: true
		});
	};
	var server = net.createServer(handleConn);
	server.on('listening', done);
	server.on('error', function (error) {
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

module.exports.onClosed = function (func) {
	module.exports._onClosed = func;
};

module.exports.onKilled = function (func) {
	module.exports._onKilled = func;
};

module.exports._onClosed = function () {

};

module.exports._onKilled = function () {

};

module.exports.setHeartbeatResponseFormat = function (_formatFunction) {
	if (typeof _formatFunction !== 'function') {
		throw new Error('RPCHeartbeatFormatFunctionMustBeAFunction');
	}
	formatFunction = _formatFunction;
};

function handleHeartbeat(state, cb) {
	state.connection.heartbeatTime = Date.now();
	var res = {
		message: 'heartbeat',
		serverTime: state.connection.heartbeatTime
	};
	if (formatFunction) {
		var formatted = formatFunction(res);
		if (formatted) {
			res = formatted;
		}
	}
	cb(res);
}

function handleConn(sock) {
	var opt = {
		cryptoEngine: cryptoEngine
	};

	var connId = gn.lib.uuid.v4().toString();
	var conn = new Connection(connId, sock, opt);
	
	emitter.once('close', function () {
		conn.close();
	});
	
	if (cryptoEngine) {
		conn.useCryptoEngine(cryptoEngine);
	}

	conn.on('close', function () {
		module.exports._onClosed(this.id, this);
		conn = null;
	});

	conn.on('kill', function () {
		module.exports._onKilled(this.id, this);
		conn = null;
	});

	logger.info('new TCP connection (id:' + connId + ') from:', sock.remoteAddress + ':' + sock.remotePort);
}

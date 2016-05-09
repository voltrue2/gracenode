'use strict';

var net = require('net');
var gn = require('../gracenode');

var Connection = require('./connection');
var router = require('./router');
var hooks = require('./hooks');
var protocol = require('../../lib/packet/protocol');

var logger;
var config;
var conns = {};
var cryptoEngine = {
	encrypt: null,
	decrypt: null
};
var connId = 0;

var PORT_IN_USE = 'EADDRINUSE';
var TIMEOUT_FOR_CLOSE = 5000;
var HEARTBEAT = {
	ID: 911,
	NAME: 'heartbeat'
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
	logger = gn.log.create('RPC');
	config = gn.getConfig('rpc');

	if (!gn.isSupportedVersion()) {
		return gn.stop(new Error(
			'RPC server does not support node.js version: ' + process.version
		));
	}

	protocol.setup(gn);

	if (!config || !config.host || !config.portRange) {
		return cb();
	}
	
	if (!Array.isArray(config.portRange) || config.portRange.length < 2) {
		logger.error(
			'incorrect port range',
			'(must be an array of 2 elements from smallest to biggest):',
			config.portRange
		);
		throw new Error('<PORT_RANGE_FOR_RPC_SERVER_INCORRECT>');
	}

	// set up RPC command controller router
	router.setup();
	
	var ports = [];
	var portIndex = 0;
	var boundPort;

	for (var p = config.portRange[0]; p <= config.portRange[1]; p++) {
		ports.push(p);
	}

	logger.verbose('port range is', config.portRange[0], 'to', config.portRange[1]);

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
			for (var id in conns) {
				conns[id].close();
			}

			// set up time out if connections do not close within the time, it hard closes
			setTimeout(next, TIMEOUT_FOR_CLOSE);
			logger.info(
				'RPC server will forcefully close if all connections do not close in',
				TIMEOUT_FOR_CLOSE, 'msc'
			);

			// stop accepting new connections and shutdown when all connections are closed
			server.close(next);
		});

		connectionInfo.host = config.host;
		connectionInfo.port = boundPort;

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

		logger.info('RPC server started at', config.host + ':' + boundPort);
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
	// cmdIdList can contain command names instead of command IDs
	cmdIdList = router.getIdsByNames(cmdIdList);
	hooks.add(cmdIdList, handler);
};

// get the connection map of this process
module.exports.getAllConnections = function () {
	var map = {};
	for (var id in conns) {
		map[id] = conns[id];
	}
	return map;
};

// get a connection by connection.data object
// values of data object is to be controlled by command controller functions
// valList can be an array
// TODO: probably not too smart with the loop of all connections...
module.exports.getConnectionsByData = function (key, valList) {
	if (!Array.isArray(valList)) {
		valList = [valList];
	}
	var list = [];
	for (var id in conns) {
		if (valList.indexOf(conns[id].data[key]) !== -1) {
			list.push(list);
		}
	}
	return list;
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

// get a connection by connection ID
module.exports.getConnectionById = function (id) {
	return conns[id] || null;
};

function handleHeartbeat(state, cb) {
	state.connection.heartbeatTime = Date.now();
	cb({
		message: 'heartbeat',
		serverTime: state.connection.heartbeatTime
	});
}

function handleConn(sock) {
	var opt = {
		cryptoEngine: cryptoEngine
	};

	var conn = new Connection(connId, sock, opt);
	
	if (cryptoEngine) {
		conn.useCryptoEngine(cryptoEngine);
	}

	conn.on('close', function () {
		module.exports._onClosed(this.id, this);
		delete conns[this.id];
	});

	conn.on('kill', function () {
		module.exports._onKilled(this.id, this);
		delete conns[this.id];
	});

	logger.info('new TCP connection (id:' + connId + ') from:', sock.remoteAddress + ':' + sock.remotePort);

	conns[connId] = conn;
	
	connId += 1;
}

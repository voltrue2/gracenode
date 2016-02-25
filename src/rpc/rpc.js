'use strict';

var net = require('net');
//var crypto = require('crypto');
var gn = require('../gracenode');

var Connection = require('./connection');

var logger;
var config;
var conns = {};
var connId = 0;

var SOCK_TIMEOUT = 30000;
var AUTH_TIMEOUT = 3000;

module.exports.setup = function () {
	config = gn.getConfig('rpc');

	if (!config || !config.host || !config.port) {
		return;
	}
	
	logger = gn.log.create('RPC');
	
	var server = net.createServer(handleConn);
	server.listen(config.port, config.host);

	// gracenode shutdown task
	gn.onExit(function RPCShutdown(next) {
		logger.info(
			'RPC server closing',
			config.host + ':' + config.port,
			'waiting for all open connections to close...'
		);

		// instruct all connections to close
		for (var id in conns) {
			conns[id].close();
		}

		// stop accepting new connections and shutdown when all connections are closed
		server.close(next);
	});

	logger.info('RPC server started at', config.host + ':' + config.port); 
};

function handleConn(sock) {
	var opt = {
		sockTimeout: config.socketTimeout || SOCK_TIMEOUT,
		authTimeout: config.authTimeout || AUTH_TIMEOUT
	};

	var conn = new Connection(connId, sock, opt);
	conn.on('kill', function () {
		delete conns[connId];
	});

	logger.info('new TCP connection (id:' + connId + ') from:', sock.remoteAddress + ':' + sock.remotePort);
	
	connId += 1;

	conns[connId] = conn;
}

// test code
gn.config({
	rpc: {
		host: 'localhost',
		port: 8889
	}
});
gn.start(function () {
	module.exports.setup();
});

'use strict';

const net = require('net');
const gn = require('../gracenode');
const transport = gn.lib.packet;

const conf = {
	address: '127.0.0.1',
	port: 8100
};
const info = {
	address: '127.0.0.1',
	port: 0
};
const conns = {};
const E_PORT_IN_USE = 'EADDRINUSE';

var logger;
var server;
var notifier;

module.exports = {
	config: config,
	setup: setup,
	emit: emit,
	on: on,
	info: getInfo
};

function config(_conf) {
	if (_conf.address) {
		conf.address = _conf.address;
	}
	if (_conf.port) {
		conf.port = _conf.port;
	}
	logger = gn.log.create(
		'portal.broker.delivery.tcp'
	);
}

function setup(cb) {
	server = net.createServer(_manageConn);
	server.on('listening', __onListening);
	server.on('error', __onError);
	server.listen({
		port: conf.port,
		host: conf.address,
		exclusive: true
	});
	function __onListening() {
		const ad = server.address();
		info.address = ad.address;
		info.port = ad.port;
		logger.info(
			'Mesh network ready:',
			info.address,
			info.port
		);
		cb();
	}

	function __onError(error) {
		if (error && error.code === E_PORT_IN_USE) {
			conf.port += 1;
			setup(cb);
			return;
		}
		logger.error(
			'Failed to start mesh network:',
			conf,
			error
		);
		cb(error);
	}
}

function _manageConn(sock, localKey) {
	// setup the new socket
	const key = localKey || _remoteSockKey(sock);
	const stream = new transport.Stream();
	sock.on('data', __onData);
	sock.on('error', __onError);
	sock.on('close', __onClose);
	sock.on('end', __onEnd);
	
	// setup response handler	
	const split = key.split('/');
	const addr = split[0];
	const port = split[1];
	const response = _createResponse(sock, addr + '/' + port);
	
	// now manage the socket connections
	if (conns[key]) {
		logger.debug('Replace the client sock:', key);
		conns[key].deadSock = conns[key].sock;
		conns[key].sock = null;
	} else {
		conns[key] = {
			sock: null,
			deadSock: null
		};
	}

	logger.debug('New socket registered:', key);

	// register new socket	
	conns[key].sock = sock;
	
	// these are listeners of the new socket
	function __onData(buf) {
		stream.lazyParse(buf, __streamHandler);
	}

	function __streamHandler(error, list) {
		if (error) {
			logger.error(
				'Failed to handle mesh network data stream:',
				error
			);
			return;
		}
		for (var i = 0, len = list.length; i < len; i++) {
			notifier(list[i].payload, response);
		}
	}

	function __onError(error) {
		logger.error(
			'Mesh network connection detected an error:',
			key, error
		);
		if (conns[key] && conns[key].deadSock) {
			conns[key].deadSock = null;
		}
		sock.destroy();
	}
	
	function __onClose() {
		logger.debug(
			'Mesh network connection has closed:',
			key
		);
		if (conns[key] && conns[key].deadSock) {
			conns[key].deadSock = null;
		}
		sock.destroy();
	}

	function __onEnd() {
		logger.debug(
			'Mesh network connection has ended:',
			key
		);
		if (conns[key] && conns[key].deadSock) {
			conns[key].deadSock = null;
		}
		sock.destroy();
	}

	return key;	
}

function _remoteSockKey(sock) {
	const ad = sock.address();
	return ad.address + '/' + ad.port;
}

function _createResponse(sock, key) {
	const addr = sock.remoteAddress;
	const port = sock.remotePort;
	function __response(resPayload) {
		logger.debug(
			'Emit response to',
			addr,
			port
		);
		const req = transport.createRequest(
			0,
			0,
			resPayload
		);
		_write(key, req);
	}
	return __response;
}

function emit(addr, port, packed) {
	const key = addr + '/' + port;
	const conn = conns[key];
	if (!conn || conn.sock.destroyed) {
		logger.debug(
			'Mesh network connection not found:',
			key,
			'create a new connection'
		);
		_createSock(addr, port, key, packed);
		return;
	}
	const req = transport.createRequest(
		0,
		0,
		packed
	);
	logger.debug('Emitting to', addr, port);
	_write(key, req);
}

function _createSock(addr, port, key, packed) {
	// create a new socket
	const sock = net.Socket();
	sock.connect(port, addr, __onListening);
	
	// setup the new socket
	_manageConn(sock, key);

	function __onListening() {
		emit(addr, port, packed);
	}
}

function _write(key, bytes) {
	if (!conns[key]) {
		logger.error('Missing socket', key);
	}
	if (conns[key].deadSock) {
		// write to the dead socket and remove it
		conns[key].sock.write(bytes, 'binary');
		conns[key].deadSock.end();
		conns[key].deadSock = null;
	} else {
		conns[key].sock.write(bytes, 'binary');
	}
}

function on(_notifier) {
	notifier = _notifier;
}

function getInfo() {
	return info;
}


'use strict';

const dgram = require('dgram');
const gn = require('../gracenode');
const packer = require('./packer');

const conf = {
	address: '127.0.0.1',
	port: 8100,
};
const info = {
	address: '127.0.0.1',
	port: 0
};

const E_PORT_IN_USE = 'EADDRINUSE';

var logger;
var server;
var notifier;

module.exports = {
	config: config,
	setup: setup,
	emit: _emit,
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
		'portal.broker.delivery.udp'
	);
}

function setup(cb) {
	if (server) {
		server.close();
		server = null;
	}
	server = dgram.createSocket('udp4');
	server.on('listening', __onListening);
	server.on('error', __onError);
	server.on('message', _handleMessage);
	server.bind({
		port: conf.port,
		address: conf.address,
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
		if (error.code === E_PORT_IN_USE) {
			conf.port += 1;
			setup(cb);
			return;
		}
		logger.error(
			'Failed to start mesh network',
			conf,
			error
		);
		cb(error);
	}
}

function _handleMessage(buf, remote) {
	var resp = _onMessageResponse.bind({ remote: remote });
	var uncmp = packer.uncompress(buf);
	if (uncmp) {
		for (var i = 0, len = uncmp.length; i < len; i++) {
			notifier(uncmp[i], resp);
		}
		return;
	}
	notifier(buf, resp);
}

function _onMessageResponse(payload) {
	var remote = this.remote;
	module.exports.emit(
		remote.address,
		remote.port,
		payload,
		true
	);
}

function _emit(addr, port, packed, isResponse) {
	logger.sys(
		'Emitting to', addr, port,
		'as response', isResponse ? true : false
	);
	server.send(packed, 0, packed.length, port, addr, _onEmit.bind({
		addr: addr,
		port: port,
		packed: packed
	}));
}

function _onEmit(error) {
	if (error) {
		logger.trace(
			'Mesh network failed to send:',
			this.addr, this.port,
			error,
			this.packed
		);
	}
}

function on(_notifier) {
	notifier = _notifier;
}

function getInfo() {
	return info;
}


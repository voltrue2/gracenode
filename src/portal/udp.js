'use strict';

const dgram = require('dgram');
const gn = require('../gracenode');
const packer = require('./packer');

const conf = {
	address: '127.0.0.1',
	port: 8100,
	relayInterval: 0
};
const info = {
	address: '127.0.0.1',
	port: 0
};

const emitBuffer = {};

const E_PORT_IN_USE = 'EADDRINUSE';

var logger;
var server;
var notifier;

module.exports = {
	config: config,
	setup: setup,
	// emit is either _bufferEmit or
	// _emit dependes on relayInterval
	emit: null,
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
	if (_conf.relayInterval) {
		conf.relayInterval = _conf.relayInterval;
	}
	logger = gn.log.create(
		'portal.broker.delivery.udp'
	);
	if (conf.relayInterval) {
		logger.info(
			'Timed emit enabled at every',
			conf.relayInterval,
			'ms'
		);
		module.exports.emit = _bufferEmit;
		_timedEmit();
	} else {
		logger.info('Emit buffering is disabled');
		module.exports.emit = _emit;
	}
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
	const resp = _createResponse(remote);
	const uncmp = packer.uncompress(buf);
	if (uncmp) {
		for (var i = 0, len = uncmp.length; i < len; i++) {
			notifier(uncmp[i], resp);
		}
		return;
	}
	notifier(buf, resp);
}

function _createResponse(remote) {
	function __response(payload) {
		module.exports.emit(
			remote.address,
			remote.port,
			payload,
			true
		);
	}
	return __response;
}

function _emit(addr, port, packed, isResponse) {
	try {
		logger.debug(
			'Emitting to', addr, port,
			'as response', isResponse ? true : false
		);
		server.send(packed, 0, packed.length, port, addr);
	} catch (error) {
		logger.error(
			'Mesh network failed to send:',
			addr, port,
			error
		);
	}
}

function _bufferEmit(addr, port, packed, isResponse) {
	logger.debug(
		'Emitting to', addr, port,
		'as response', isResponse
	);
	const key = addr + '/' + port;
	if (!emitBuffer[key]) {
		emitBuffer[key] = [];
	}
	emitBuffer[key].push(packed);
}

function _timedEmit() {
	for (const key in emitBuffer) {
		if (!emitBuffer[key] || !emitBuffer[key].length) {
			continue;
		}
		const list = key.split('/');
		const cmp = packer.compress(emitBuffer[key]);
		emitBuffer[key] = [];
		try {
			server.send(
				cmp,
				0,
				cmp.length,
				parseInt(list[1]),
				list[0]
			);
		} catch (err) {
			logger.error(
				'Mesh network failed to emit:',
				key,
				err
			);
		}
	}
	setTimeout(_timedEmit, conf.relayInterval);
}

function on(_notifier) {
	notifier = _notifier;
}

function getInfo() {
	return info;
}


'use strict';

const dgram = require('dgram');
const gn = require('../../src/gracenode');
const packer = require('./packer');
const delivery = require('./delivery');

const conf = {
	// enable: false,
	address: '127.0.0.1',
	port: 8000,
	relayLimit: 10,
	compress: false
};

const PORT_IN_USE = 'EADDRINUSE';

var server;
var logger;
var info;
var onDelivery;

module.exports.config = function (_conf) {
	if (_conf.enable) {
		conf.enable = _conf.enable;
	}
	if (_conf.address) {
		conf.address = _conf.address;
	}
	if (_conf.port) {
		conf.port = _conf.port;
	}
	logger = gn.log.create('portal.delivery:udp');
};

module.exports.setup = function (cb) {
	if (!conf.enable) {
		return cb();
	}
	startServer(cb);
};

module.exports.info = function () {
	if (!info) {
		return null;
	}
	return {
		address: info.address,
		port: info.port
	};
};

module.exports.send = function (addr, port, dataBytes, cb) {
	if (!server) {
		if (typeof cb === 'function') {
			cb();
		}
		return;
	}
	try {
		server.send(dataBytes, 0, dataBytes.length, port, addr, cb);
	} catch (error) {
		logger.error('failed to send:', addr, port, error);
		cb();
	}
};

module.exports.onDelivery = function (func) {
	onDelivery = func;
};

function startServer(cb) {
	const done = function () {
		gn.onExit(function portalUDPShutdown(next) {
			try {
				server.close();
				server = null;
			} catch (error) {
				logger.error(error);
			}
			next();
		});
		logger.info(
			'started server:',
			conf.address, conf.port
		);
		server.on('message', handleMessage);
		info = server.address();
		cb();
	};
	const handleError = function (error) {
		if (error.code === PORT_IN_USE) {
			conf.port += 1;
			startServer(cb);
			return;
		}
		logger.error(
			'failed to start:',
			conf.address, conf.port
		);
		gn.stop(error);
	};
	
	if (server) {
		server.close();
	}

	server = dgram.createSocket('udp4');
	server.on('error', handleError);
	server.on('listening', done);
	server.bind({
		port: conf.port,
		address: conf.address,
		exclusive: true
	});
}

function handleMessage(dataBytes) {
	const uncomp = packer.uncompress(dataBytes);
	
	if (!uncomp) {
		const unpacked = packer.unpack(delivery.DSCHEMA, dataBytes);
		onDelivery(unpacked);
		return;
	}

	for (var i = 0, len = uncomp.length; i < len; i++) {
		const unpacked = packer.unpack(delivery.DSCHEMA, uncomp[i]);
		onDelivery(unpacked);
	}
}

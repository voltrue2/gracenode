'use strict';

const dgram = require('dgram');
const gn = require('../../src/gracenode');
const packer = require('./packer');
const Delivery = require('./delivery').Delivery;
const PSCHEMA = require('./delivery').PACKET_SCHEMA;
const conf = {
	address: '127.0.0.1',
	port: 8000,
	relayLimit: 10
};

const PORT_IN_USE = 'EADDRINUSE';

var server;
var receiver;
var logger;
var delivery;
var myInfo = null;
var shutdown = false;

module.exports.config = function (_conf) {
	gn.mod.defaults.apply(conf, _conf);
	logger = gn.log.create('connection.mesh:udp');
};

module.exports.setup = function (cb) {
	gn.onExit(function CloseMeshOnExit(next) {
		shutdown = true;
		try {
			server.close();
		} catch (e) {
			logger.error(e);
		}
		next();
	});
	bind(cb);
};

module.exports.setReceiver = function (_receiver) {
	receiver = _receiver;
	const sender = function (nodes, addr, port, dataBytes) {
		const packed = packer.pack(PSCHEMA, {
			nodes: nodes,
			packed: dataBytes
		});
		/** 
		let the event loop execute other tasks:
		if we are busy this operation can occupy the event loop...
		to avoid that, we "send" one at a time at the end of each
		event loop
		*/
		setImmediate(function () {
			server.send(packed, 0, packed.length, port, addr);
		});
	};
	delivery = new Delivery(
		module.exports.info(),
		receiver,
		sender,
		conf.relayLimit	
	);
};

module.exports.info = function () {
	return myInfo;
};

module.exports.send = function (dataBytes, nodes) {
	delivery.send(dataBytes, nodes);
};

function receiveMessage(buf) {
	const handle = function () {
		setImmediate(function () {
			const unpacked = packer.unpack(
				PSCHEMA,
				buf
			);
			receiver(unpacked.name, unpacked.packed);
			if (unpacked.nodes.length) {
				// relay the message to next mesh node
				module.exports.send(
					unpacked.packed,
					unpacked.nodes
				);
			}
		});
	};
	handle();
}

function bind(cb) {
	logger.verbose('Binding to:', conf.address, conf.port);
	const done = function () {
		logger.info(
			'Internal mesh network started:',
			conf.address, conf.port
		);
		server.on('message', receiveMessage);
		myInfo = server.address();
		cb();
	};
	const handleError = function (error) {
		if (error.code === PORT_IN_USE) {
			logger.verbose('Port is in use:', conf.port);
			conf.port += 1;
			bind(cb);
			return;
		}
		logger.error('Failed to bind:', conf.address, conf.port);
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
		// workers do NOT share the same port
		exclusive: true
	});
}

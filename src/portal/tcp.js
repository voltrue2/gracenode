'use strict';

const net = require('net');
const gn = require('../../src/gracenode');
const transport = gn.lib.packet;
const packer = require('./packer');
const Delivery = require('./delivery').Delivery;
const PSCHEMA = require('./delivery').PACKET_SCHEMA;

const PORT_IN_USE = 'EADDRINUSE';
const ENC = 'binary';

const info = {
	host: '',
	address: '',
	port: 0,
	family: ''
};
const connMap = {};
var conf = {
	address: '127.0.0.1',
	port: 8000,
	relayLimit: 10
};
var logger;
var conn;
var server;
var receiver;
var delivery;

module.exports.config = function (_conf) {
	gn.mod.defaults.apply(conf, _conf);
	logger = gn.log.create('portal:tcp');
};

module.exports.setup = function (cb) {
	gn.onExit(function ShutdownInternalMeshNetwork(next) {
		try {
			logger.info('Shutting down internal mesh network server');
			server.close();
			next();
		} catch (error) {
			logger.error('Failed to shut down internal mesh network properly:', error);
			next(error);
		}
	});
	startServer(cb);
};

module.exports.setReceiver = function (_receiver) {
	receiver = _receiver;
	// TODO: refactor this b/c it's messy...
	const _sender = function (addr, port, key, packed) {
		if (!connMap[key]) {
			const client = net.Socket();
			client.connect(port, addr, function (error) {
				if (error) {
					logger.error(error);
					return;
				}
				connMap[key] = client;
				try {
					connMap[key].write(
						transport.createRequest(
							0,
							0,
							packed
						),
						ENC
					);
				} catch (err) {
					logger.error(
						'Failed to send internal command:',
						err
					);
					if (connMap[key]) {
						connMap[key].end();
					}
					delete connMap[key];
				}
			});
			return;
		}
		try {
			connMap[key].write(transport.createRequest(0, 0, packed), ENC);
		} catch (err) {
			logger.error('Failed to send internal command:', err);
			if (connMap[key]) {
				connMap[key].end();
			}
			delete connMap[key];
		}

	};
	const sender = function (nodes, addr, port, dataBytes) {
		const key = addr + '/' + port;
		const packed = packer.pack(PSCHEMA, {
			nodes: nodes,
			packed: dataBytes
		});
		_sender(addr, port, key, packed);
	};
	delivery = new Delivery(
		module.exports.info,
		receiver,
		sender,
		conf.relayLimit
	);
};

module.exports.info = function () {
	return info;
};

module.exports.send = function (dataBytes, nodes) {
	delivery.send(dataBytes, nodes);
};

function startServer(cb) {
	server = net.createServer(handleConnection);
	server.on('listening', function () {
		handleListening();
		// ready
		logger.info('Internal mesh network started:', info.address, info.port);
		cb();
	});
	server.on('error', function (error) {
		if (error && error.code === PORT_IN_USE) {
			logger.verbose('Port is in use:', conf.port);
			conf.port += 1;
			startServer(cb);
			return;
		}
		logger.error('Failed to start internal mesh network:', error, conf);
		cb(error);
	});
	server.listen({
		port: conf.port,
		host: conf.address,
		exclusive: true
	});
}

function handleListening() {
	const connInfo = server.address();
	if (connInfo) {
		info.address = connInfo.address;
		info.host = conf.address;
		info.port = connInfo.port;
		info.family = connInfo.family;
	}
}

function handleConnection(sock) {
	logger.debug('New mesh node connected', sock.remoteAddress, sock.remotePort);
	conn = new Connection(sock);
}

function Connection(sock) {
	const that = this;
	this.sock = sock;
	this.stream = new transport.Stream();
	this.sock.on('data', function (data) {
		that.receiveData(data);
	});
	this.sock.on('end', function () {
		that.handleEnd();
	});
	this.sock.on('close', function () {
		that.handleClose();
	});
	this.sock.on('error', function (error) {
		that.handleError(error);
	});
}

Connection.prototype.receiveData = function (buf) {
	const handleReg = function (payload) {
		const unpacked = packer.unpack(PSCHEMA, payload);
		receiver(unpacked.name, unpacked.packed);
		if (unpacked.nodes.length) {
			module.exports.send(
				unpacked.packed,
				unpacked.nodes,
				unpacked.proto
			);
		}
	};
	const handle = function (error, parsed) {
		if (error) {
			return logger.error(
				'Internal command could not be handled:',
				error
			);
		}
		for (var i = 0, len = parsed.length; i < len; i++) {
			const payload = parsed[i].payload;
			handleReg(payload);
		}
	};
	this.stream.lazyParse(buf, handle);
};

Connection.prototype.handleEnd = function () {
	logger.debug(this.sock.remoteAddress, this.sock.remotePort, 'closed connection');
};

Connection.prototype.handleClose = function () {
	logger.debug('Closing connection to', this.sock.remoteAddress, this.sock.remotePort);
	this.sock.end();
};

Connection.prototype.handleError = function (error) {
	logger.error(this.sock.remoteAddress, this.sock.remotePort, error);
};

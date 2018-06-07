'use strict';

const dgram = require('dgram');
const gn = require('../gracenode');

const conf = {
	address: '127.0.0.1',
	port: 8100,
};
const info = {
	address: '127.0.0.1',
	port: 0
};

const E_PORT_IN_USE = 'EADDRINUSE';
const PING_MSG = gn.Buffer.alloc('ping');
const PONG_MSG = gn.Buffer.alloc('PONG\n');
const TIMEOUT = 60000;
const RETRY = 500;
const RFLAG = gn.Buffer.alloc(1);
const NFLAG = gn.Buffer.alloc(1);
const AFLAG = gn.Buffer.alloc(1);
RFLAG.writeUInt8(0x00);
NFLAG.writeUInt8(0x01);
AFLAG.writeUInt8(0x02);
const reliables = {};
const _onTimeOutCallbacks = [];

var logger;
var server;
var notifier;

module.exports = {
	config: config,
	setup: setup,
	emit: _emit,
	remit: _remit,
	on: on,
	info: getInfo,
	onTimeOut: onTimeOut
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
	if (_handlePing(buf)) {
		server.send(PONG_MSG, 0, PONG_MSG.length, remote.port, remote.address);
		return;
	}
	// reliable or non-reliable?
	var flag = buf[0];
	// remove flag byte
	var packed = buf.slice(1);
	logger.sys(
		'Emit received reliable?',
		(flag === RFLAG[0]) ? true : false,
		'ack?', (flag === AFLAG[0]) ? true : false
	);
	switch (flag) {
		case RFLAG[0]:
			// this is a reliable message and it requires a response
			var id = gn.lib.uuid.create(packed.slice(0, 16));
			// remove id bytes
			packed = packed.slice(16);
			// send ack response
			logger.sys(
				'Sending reliable emit ack to',
				remote.address, remote.port,
				'ID:', id.toString()
			);
			_ack(remote.address, remote.port, id.toBytes());
		case NFLAG[0]:
			logger.sys('Handle message from:', remote.address, remote.port, packed.toString());
			var resp = _onMessageResponse.bind(null, { remote: remote, flag: flag });
			notifier(packed, resp);
		break;
		case AFLAG[0]:
			var sid = gn.lib.uuid.create(packed).toString();
			logger.sys('Reliable emit ack received ID:', sid);
			if (reliables[sid]) {
				logger.sys('Reliable emit handling completed for ID:', sid);
				clearTimeout(reliables[sid].retry);
				delete reliables[sid];
			}
		break;
	}
}

function _handlePing(buf) {
	if (buf[0] === PING_MSG[0] &&
		buf[1] === PING_MSG[1] &&
		buf[2] === PING_MSG[2] &&
		buf[3] === PING_MSG[3]
	) {
		return true;
	}
	return false;
}

function _onMessageResponse(bind, payload) {
	var remote = bind.remote;
	var flag = bind.flag;
	if (flag === RFLAG) {
		module.exports.remit(
			remote.address,
			remote.port,
			payload,
			true
		);
		return;
	}
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
	var packet = Buffer.concat([ NFLAG, packed ]);
	server.send(packet, 0, packet.length, port, addr, _onEmit.bind(null, {
		addr: addr,
		port: port,
		packet: packet
	}));
}

function _remit(addr, port, packed, isResponse) {
	var id = gn.lib.uuid.v4();
	var sid = id.toString();
	var packet = Buffer.concat([ RFLAG, id.toBytes(), packed ]);
	var time = Date.now() + TIMEOUT;
	var bind = {
		id: id,
		time: time,
		addr: addr,
		port: port,
		packet: packet
	};
	reliables[sid] = {
		time: time,
		retry: setTimeout(_retryRemit.bind(null, bind), RETRY)
	};
	logger.sys('Reliable emitting to',
		addr, port,
		'ID:', sid,
		'as response', isResponse ? true : false
	);
	server.send(packet, 0, packet.length, port, addr, _onEmit.bind(null, {
		addr: addr,
		port: port,
		packet: packet
	}));
}

function _retryRemit(bind) {
	var sid = bind.id.toString();
	var time = bind.time; 
	var addr = bind.addr;
	var port = bind.port;
	var packet = bind.packet;
	var now = Date.now();
	logger.sys(
		'Retry reliable emit ID:', sid,
		'TimeOut?', (now >= time ? true : false),
		'Will send?', (reliables[sid] ? true : false)
	);
	if (now >= time) {
		// timeout
		logger.error('Reliable emit timed out ID:', sid);
		clearTimeout(reliables[sid].retry);
		delete reliables[sid];
		// remove 17 bytes = 1 byte the flag + 16 bytes of relaible message ID
		packet = packet.slice(17);
		for (var i = 0, len = _onTimeOutCallbacks.length; i < len; i++) {
			_onTimeOutCallbacks[i](packet);
		}
		return;
	}
	if (!reliables[sid]) {
		return;
	}
	// set up and send retry
	reliables[sid].retry = setTimeout(_retryRemit.bind(null, bind), RETRY);
	server.send(packet, 0, packet.length, port, addr, _onEmit.bind(null, {
		addr: addr,
		port: port,
		packet: packet
	}));
}

function _ack(addr, port, idBytes) {
	var buf = Buffer.concat([ AFLAG, idBytes ]);
	server.send(buf, 0, buf.length, port, addr);
}

function _onEmit(bind, error) {
	if (error) {
		logger.trace(
			'Mesh network failed to send:',
			bind.addr, bind.port,
			error,
			bind.packet,
			'reliable?',
			bind.packet[0] === RFLAG ? true : false
		);
	}
}

function on(_notifier) {
	notifier = _notifier;
}

function getInfo() {
	return info;
}

function onTimeOut(onTimeOutCallback) {
	_onTimeOutCallbacks.push(onTimeOutCallback);
}



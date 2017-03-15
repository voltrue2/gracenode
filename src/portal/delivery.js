'use strict';

const dgram = require('dgram');
const async = require('../../lib/async');
const packer = require('./packer');
const gn = require('../../src/gracenode');

const conf = {
	// enable: false,
	address: '127.0.0.1',
	port: 8000,
	relayLimit: 10,
	compress: false
};

const PORT_IN_USE = 'EADDRINUSE';
const DSCHEMA = '__portal__delivery__schema';

const namelist = [];
const onmap = {};
const buff = {};

var server;
var logger;
var info;

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
	if (_conf.relayLimit) {
		conf.relayLimit = _conf.relayLimit;
	}
	if (_conf.compress) {
		conf.compress = _conf.compress;
	}
	logger = gn.log.create('portal.delivery');
};

module.exports.setup = function (cb) {
	if (!conf.enable) {
		return cb();
	}
	packer.schema(DSCHEMA, {
		id: packer.UINT32,
		payload: packer.BIN,
		list: packer.STR_ARR
	});
	startServer(cb);
};

module.exports.info = function () {
	if (!info) {
		return {};
	}
	return {
		address: info.address,
		port: info.port
	};
};

module.exports.schema = function (name, struct) {
	if (namelist.indexOf(name) !== -1) {
		throw new Error('PortalDeliveryShcemaNameAlreadyUsed');
	}
	namelist.push(name);
	packer.schema(name, struct);
};

module.exports.on = function (name, func) {
	if (!onmap[name]) {
		onmap[name] = [];
	}
	onmap[name].push(func);
};

/**
destlist [
	{ address, port }
	[...]
]
*/
module.exports.send = function (name, deliveryData, destlist, cb) {
	const id = namelist.indexOf(name);
	
	if (id === -1) {
		cb(new Error('InvalidPortalDeliveryName:' + name));
	}

	const data = {
		id: id,
		payload: packer.pack(name, deliveryData),
		list: []
	};	
	var limit = conf.relayLimit;
	if (destlist.length <= conf.relayLimit) {
		limit = destlist.length;
	}
	var nexts = [];
	var index = 0;
	var counter = 0;
	nexts.length = destlist.length;
	while (destlist.length) {
		if (!nexts[index]) {
			nexts[index] = [];
			counter += 1;
		}
		nexts[index].push(destlist.shift());
		index += 1;
		if (index === limit) {
			index = 0;
		}
	}
	nexts = nexts.slice(0, counter);
	prepareDelivery(nexts, data, cb);
};

function prepareDelivery(nexts, data, cb) {
	const list = nexts.shift();
	if (!list) {
		if (typeof cb === 'function') {
			cb();
		}
		return;
	}
	const dest = list.shift().key.split('/');
	const addr = dest[0];
	const port = parseInt(dest[1]);
	// add list to data object
	data.list = list;
	// send the delivery
	sendDelivery(nexts, addr, port, data, cb);
}

function sendDelivery(nexts, addr, port, data, cb) {
	if (!server) {
		if (typeof cb === 'function') {
			cb();
		}
		return;
	}
	if (!addr || !port) {
		const err = new Error('PortalDeliveryError');
		logger.error(
			'address/port not valid',
			addr, port, err.stack
		);
		if (typeof cb === 'function') {
			cb();
		}
		return;	
	}
	try {
		// local delivery
		if (addr === info.address && port === info.port) {
			onDelivery(data);	
			return nextDelivery(nexts, data, cb);
		}
		deliver(nexts, addr, port, data, cb);
	} catch (error) {
		logger.error('delivery failed:', addr, port, error);
		nextDelivery(nexts, data, cb);
	}
}

function deliver(nexts, addr, port, data, cb) {
	if (!server) {
		if (typeof cb === 'function') {
			cb();
		}
		return;
	}
	const dataBytes = packer.pack(DSCHEMA, data);
	if (conf.compress) {
		const key = addr + '/' + port;
		if (!buff[key]) {
			buff[key] = [];
		}
		buff[key].push(dataBytes);
		return nextDelivery(nexts, data, cb);
	}
	logger.verbose('send:', addr, port, data);
	server.send(dataBytes, 0, dataBytes.length, port, addr, function () {
		nextDelivery(nexts, data, cb);
	});
}

function nextDelivery(nexts, data, cb) {
	setImmediate(function __portalOnNextDelivery() {
		prepareDelivery(nexts, data, cb);
	});
}

function timedDelivery() {
	const INTERVAL = (typeof conf.compress === 'number') ? conf.compress : 250;
	const send = function __portalTimedDeliverySend(addr, port, compressed, cb) {
		try {
			logger.verbose('timed send:', addr, port);
			server.send(compressed, 0, compressed.length, port, addr, function () {
				setImmediate(cb);
			});
		} catch (error) {
			logger.error('timed delivery failed:', error);
			cb();
		}
	};
	const start =  function __portalTimedDeliveryStart() {
		const keys = Object.keys(buff);
		async.forEach(keys, function (key, next) {
			const list = key.split('/');
			if (!buff[key].length) {
				return next();
			}
			const compressed = packer.compress(buff[key]);
			buff[key] = [];
			send(list[0], list[1], compressed, next);
		}, function __portalTimedDeliveryNext() {
			setImmediate(start, INTERVAL);
		});
	};
	setImmediate(start, INTERVAL);
}

function onDelivery(data) {
	const name = namelist[data.id];
	if (!name) {
		logger.error('invalid delivery id', data);
		return;
	}
	if (!onmap[name] || !onmap[name].length) {
		logger.warn('no event listener for ', data);
	}
	const funclist = onmap[name].concat([]);
	const exec = function () {
		const func = funclist.shift();
		if (func) {
			func(packer.unpack(name, data.payload));
		}
	};
	for (var i = 0, len = funclist.length; i < len; i++) {
		setImmediate(exec);
	}
	// relay delivery to next mesh node if any
	if (data.list && data.list.length) {
		module.exports.send(name, data.payload, data.list);
	}
}

function startServer(cb) {
	const done = function () {
		gn.onExit(function portalDeliveryShutdown(next) {
			try {
				server.close();
				server = null;
			} catch (error) {
				logger.error(error);
			}
			next();
		});
		logger.info(
			'started as UDP server:',
			conf.address, conf.port
		);
		server.on('message', handleMessage);
		info = server.address();
		if (conf.compress) {
			timedDelivery();
		}
		cb();
	};
	const handleError = function (error) {
		if (error.code === PORT_IN_USE) {
			conf.port += 1;
			startServer(cb);
			return;
		}
		logger.error(
			'failed to start as UDP:',
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
		const unpacked = packer.unpack(DSCHEMA, dataBytes);
		onDelivery(unpacked);
		return;
	}

	for (var i = 0, len = uncomp.length; i < len; i++) {
		const unpacked = packer.unpack(DSCHEMA, uncomp[i]);
		onDelivery(unpacked);
	}
}

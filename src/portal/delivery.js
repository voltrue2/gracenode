'use strict';

const async = require('../../lib/async');
const gn = require('../../src/gracenode');
const packer = require('./packer');
const udp = require('./udp');

const conf = {
	// enable: false,
	relayLimit: 10,
	compress: false
};

const DSCHEMA = '__portal__delivery__schema';

const namelist = [];
const onmap = {};
const buff = {};

var logger;
var info;

module.exports.DSCHEMA = DSCHEMA;

module.exports.config = function (_conf) {
	if (_conf.enable) {
		conf.enable = _conf.enable;
	}
	if (_conf.relayLimit) {
		conf.relayLimit = _conf.relayLimit;
	}
	if (_conf.compress) {
		conf.compress = _conf.compress;
	}
	logger = gn.log.create('portal.delivery');
	udp.config(conf);
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
	if (conf.compress) {
		timedDelivery();
	}
	udp.onDelivery(onDelivery);
	const finalize = function (next) {
		info = udp.info();
		next();
	};
	const tasks = [
		udp.setup,
		finalize
	];
	async.series(tasks, cb);
};

module.exports.info = function () {
	return info;
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
opt {
	tcp: <bool>
}
*/
module.exports.send = function (name, deliveryData, destlist, opt, cb) {
	
	if (!destlist || !destlist.length) {
		if (typeof cb === 'function') {
			return cb(new Error('DestinationNodesNotGiven:' + name));
		}
		throw new Error('DestinationNodesNotGiven:' + name);
	}

	const id = namelist.indexOf(name);
	var dataPayload = deliveryData;	

	if (id === -1) {
		if (typeof cb === 'function') {
			return cb(new Error('InvalidPortalDeliveryName:' + name));
		}
		throw new Error('InvalidPortalDeliveryName:' + name);
	}

	if (!Buffer.isBuffer(dataPayload)) {
		dataPayload = packer.pack(name, dataPayload);
	}

	const data = {
		id: id,
		payload: dataPayload,
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
		const dest = destlist.shift();
		nexts[index].push(dest.key || dest);
		index += 1;
		if (index === limit) {
			index = 0;
		}
	}
	nexts = nexts.slice(0, counter);
	prepareDelivery(nexts, data, opt, cb);
};

function prepareDelivery(nexts, data, opt, cb) {
	const list = nexts.shift();
	if (!list || !list.length) {
		if (typeof cb === 'function') {
			cb();
		}
		return;
	}
	const dest = list.shift().split('/');
	const addr = dest[0];
	const port = parseInt(dest[1]);
	// add list to data object
	data.list = list;
	// send the delivery
	sendDelivery(nexts, addr, port, data, opt, cb);
}

function sendDelivery(nexts, addr, port, data, opt, cb) {
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
	// local delivery
	if (addr === info.address && port === info.port) {
		onDelivery(data);	
		return nextDelivery(nexts, data, opt, cb);
	}
	deliver(nexts, addr, port, data, opt, cb);
}

function deliver(nexts, addr, port, data, opt, cb) {
	const dataBytes = packer.pack(DSCHEMA, data);
	if (conf.compress) {
		const proto = opt && opt.tcp ? 'tcp' : 'udp';
		if (!buff[proto]) {
			buff[proto] = {};
		}
		const key = addr + '/' + port;
		if (!buff[proto][key]) {
			buff[proto][key] = [];
		}
		buff[proto][key].push(dataBytes);
		return nextDelivery(nexts, data, opt, cb);
	}
	logger.verbose('send:', addr, port, opt, data);
	const useTcp = opt && opt.tpc ? true : false;
	switch (useTcp) {
		case true:
			/* TODO
			tcp.send(addr, port, dataBytes, function () {
				nextDelivery(nexts, data, opt, cb);
			});
			*/
			break;
		case false:
			udp.send(addr, port, dataBytes, function () {
				nextDelivery(nexts, data, opt, cb);
			});
			break;
	}
}

function nextDelivery(nexts, data, opt, cb) {
	setImmediate(function __portalOnNextDelivery() {
		prepareDelivery(nexts, data, opt, cb);
	});
}

function timedDelivery() {
	const INTERVAL = (typeof conf.compress === 'number') ? conf.compress : 250;
	const send = function __portalTimedDeliverySend(addr, port, compressed, cb) {
		logger.verbose('timed send:', addr, port);
		udp.send(addr, port, compressed, function () {
			setImmediate(cb);
		});
	};
	const start =  function __portalTimedDeliveryStart() {
		const protos = Object.keys(buff);
		async.forEach(protos, function (proto, moveon) {
			const keys = Object.keys(buff[proto]);
			async.forEach(keys, function (key, next) {
				const list = key.split('/');
				if (!buff[proto][key].length) {
					return next();
				}
				const compressed = packer.compress(buff[proto][key]);
				buff[proto][key] = [];
				send(list[0], list[1], compressed, next);
			}, moveon);
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


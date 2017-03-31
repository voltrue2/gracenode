'use strict';

const async = require('../../lib/async');
const gn = require('../../src/gracenode');
const packer = require('./packer');
const tcp = require('./tcp');
const udp = require('./udp');
const deliverySetup = require('./delivery').setup;
const PSCHEMA = require('./delivery').PACKET_SCHEMA;
const announce = require('./announce');

const TCP = 0;
const UDP = 1;
const NAME_PREFIX = '__portal_';

const callbackmap = {};
var logger;

module.exports.config = function (conf) {
	tcp.config(conf);
	udp.config(conf);
	tcp.setReceiver(receiver);
	udp.setReceiver(receiver);
	announce.config(conf);
	packer.schema(PSCHEMA, {
		name: packer.STR,
		nodes: packer.STR_ARR,
		packed: packer.BIN
        });
	logger = gn.log.create('portal');
};

module.exports.setup = function (cb) {
	packer.setup();
	deliverySetup();
	const tasks = [
		tcp.setup,
		udp.setup,
		announce.setup
	];
	async.series(tasks, cb);
};

module.exports.TCP = TCP;
module.exports.UDP = UDP;
module.exports.DATATYPE = {
	UINT8: packer.UINT8,
	INT8: packer.INT8,
	UINT16: packer.UINT16,
	INT16: packer.INT16,
	UINT32: packer.UINT32,
	INT32: packer.INT32,
	DOUBLE: packer.DOUBLE,
	STR: packer.STR,
	UINT8_ARR: packer.UINT8_ARR,
	INT8_ARR: packer.INT8_ARR,
	UINT16_ARR: packer.UINT16_ARR,
	INT16_ARR: packer.INT16_ARR,
	UINT32_ARR: packer.UINT32_ARR,
	INT32_ARR: packer.INT32_ARR,
	DOUBLE_ARR: packer.DOUBLE_ARR,
	STR_ARR: packer.STR_ARR,
	BIN: packer.BIN,
	UUID: packer.UUID,
	UUID_ARR: packer.UUID_ARR,
	BOOL: packer.BOOL,
	BOOL_ARR: packer.BOOL_ARR
};
module.exports.setValue = announce.setValue;
module.exports.getNodes = announce.getNodes;
module.exports.getAllNodes = announce.getAllNodes;
module.exports.info = info; 
module.exports.define = define;
module.exports.emit = emit;
module.exports.on = on;

/** @decription Defines a mesh network event and its data strcuture
* @param {string} name - Event name
* @param {object} dataStructure - Data structure as object
* @returns {undefined}
*/
function define(name, dataStruct) {
	const key = NAME_PREFIX + name;
	packer.schema(key, dataStruct);
}

/** @decription Defines a mesh network event listener
* @param {string} name - Event name
* @param {function} callback - Event listener callback
* @returns {undefined}
*/
function on(name, callback) {
	if (!callbackmap[name]) {
		callbackmap[name] = [];
	}
	callbackmap[name].push(callback);
}

/** @description Returns an object of address and port
* @param {string} proto - An optional protocol (tcp/udp)
* @returns {object} The object of address and port (mesh network internal server)
*/
function info(proto) {
	switch (proto) {
		case 'tcp':
			return tcp.info();
		case 'udp':
			return udp.info();
		default:
			return tcp.info();
	}
}

/**
* @param {number} protocol - Delivery protocol portal.TCP/protal.UDP
* @param {string} name - Delivery name defined by .schema(...)
* @param {string | array} nodes - Destination address and port in the format of 'address/port'
* @param {object} data - Data object to be delivered
* @returns {undefined}
*/
function emit(protocol, name, nodes, data) {
	if (!Array.isArray(nodes)) {
		nodes = [ nodes ];
	}
	const key = NAME_PREFIX + name; 
	const packed = packer.pack(key, data);
	switch (protocol) {
		case TCP:
			tcp.send(packed, nodes);
			break;
		case UDP:
			udp.send(packed, nodes);
			break;
		default:
			logger.error('Invalid protocol', protocol, name);
			break;	
	}
}

// called from tcp/udp
function receiver(name, buf) {
	const callbacks = callbackmap[name];
	if (!callbacks) {
		logger.warn(
			'Listener(s) for ', name,
			'has not been declared'
		);
		return;
	}
	const key = NAME_PREFIX + name;
	try {
		const unpacked = packer.unpack(key, buf);
		_callback(callbacks, null, unpacked);
	} catch (error) {
		_callback(callbacks, error);
	}
}

function _callback(callbacks, error, res) {
	for (var i = 0, len = callbacks.length; i < len; i++) {
		callbacks(error, res);
	}
}


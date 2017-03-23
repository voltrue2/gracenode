'use strict';

const async = require('../../lib/async');
const packer = require('./packer');
const delivery = require('./delivery');
const announce = require('./announce');

module.exports.config = function (conf) {
	delivery.config(conf);
	announce.config(conf);
};

module.exports.setup = function (cb) {
	packer.setup();
	const tasks = [
		delivery.setup,
		announce.setup
	];
	async.series(tasks, cb);
};

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
module.exports.info = delivery.info; 
module.exports.define = delivery.schema;
module.exports.send = send;
module.exports.relay = relay;
module.exports.on = delivery.on;

/**
* @param {string} name - Delivery name defined by .schema(...)
* @param {string} addr - Destination address
* @param {number} port - Destination port
* @param {buffer} payload - Payload data to be delivered
* @param {function} cb - Callback function
* @returns {undefined}
*/
function send(name, addr, port, payload, cb) {
	delivery.send(name, payload, [ { key: addr + '/' + port } ], cb);
}

/**
* @param {string} name - Delivery name defined by .schema(...)
* @param {array<string>} list - Array of destination as string in the format of <address>/<port>
* @param {buffer} payload - Payload data to be delivered
* @param {function} cb - Callback function
* @returns {undefined}
*/
function relay(name, list, payload, cb) {
	delivery.send(name, payload, list, cb);
}


'use strict';

const gn = require('../gracenode');
const packer = require('./packer');
const delivery = require('./delivery');

const RES_SCHEMA_SUFFIX = '_response';

const conf = {
	relayLimit: 10
};
var logger;

delivery._RES_SCHEMA_SUFFIX = RES_SCHEMA_SUFFIX;

module.exports = {
	TCP: delivery.TCP,
	UDP: delivery.UDP,
	config: config,
	setup: setup,
	define: define,
	emit: emit,
	on: on,
	info: delivery.info,
	// TODO: will be removed when we replace discover w/ announce.js
	onAnnounce: delivery.onAnnounce
};

function config(_conf) {
	if (_conf.relayLimit) {
		conf.relayLimit = _conf.relayLimit;
	}
	logger = gn.log.create('portal.broker');
	delivery.config(_conf);
}

function setup(cb) {
	packer.setup();
	delivery.setup(cb);
}

/** @description Defines a mesh network communication event
*	and its data structure
* @param {string} eventName - A mesh network event name
* @param {object} struct - A data structure for the event
* @param {object} responseStruct - Optional data structure for response callback
*/
function define(eventName, struct, responseStruct) {
	packer.schema(eventName, struct);
	if (typeof responseStruct === 'object') {
		packer.schema(
			eventName + RES_SCHEMA_SUFFIX,
			responseStruct
		);
	}
}

/** @description Emits(sends) a mesh network event
* @param {string} eventName - The mesh network event to emit/send as
* @param {array<string>} nodes - A list of mesh nodes
* @param {object} data - Data to be emitted/sent
* @param {function=} cb - Optional callback for emit
*/
function emit(/* protocol, */ eventName, nodes, data, cb) {
	const branches = _createNodeBranches(nodes);
	for (var i = 0, len = branches.length; i < len; i++) {
		delivery.send(
			//protocol,
			1,
			eventName,
			branches[i],
			data,
			cb
		);
	}
}

function _createNodeBranches(nodes) {
	var limit = conf.relayLimit;
	if (nodes.length <= limit) {
		limit = nodes.length;
	}
	const branches = [];
	var path = 0;
	while (nodes.length) {
		if (path < limit) {
			path = 0;
		}
		if (!branches[path]) {
			branches[path] = [];
		}
		const node = nodes.shift();
		if (node) {
			branches[path].push({
				address: node.address,
				port: node.port
			});
			path += 1;
		}
	}
	return branches;
}

function on(eventName, handler) {
	delivery.receive(eventName, handler);
}

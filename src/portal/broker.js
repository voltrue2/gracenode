'use strict';

const gn = require('../gracenode');
const announce = require('./announce');
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
	delivery.setup(cb);
}

/** @description Emits(sends) a mesh network event
* @param {number} protocol - TCP/UDP = 0 or 1
* @param {string} eventName - The mesh network event to emit/send as
* @param {array<string>} nodes - A list of mesh nodes
* @param {object} data - Data to be emitted/sent
* @param {function=} cb - Optional callback for TCP
*/
function emit(protocol, eventName, nodes, data, cb) {
	var branches = _createNodeBranches(nodes);
	logger.sys('target emit branches', branches);
	for (var i = 0, len = branches.length; i < len; i++) {
		logger.sys('emit', eventName, protocol, branches[i], data);
		delivery.send(
			protocol,
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
	var branches = [];
	var path = 0;
	while (nodes.length) {
		if (path < limit) {
			path = 0;
		}
		if (!branches[path]) {
			branches[path] = [];
		}
		var node = _getNode(nodes);
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

function _getNode(nodes) {
	var node = nodes.shift();
	if (!node) {
		return null;
	}
	if (!announce.nodeExists(node.address, node.port)) {
		// node we found does is no longer available: find next node
		return _getNode(nodes);	
	}
	// this node is available
	return node;
}

function on(eventName, handler) {
	delivery.receive(eventName, handler);
}


'use strict';

const gn = require('../../src/gracenode');
var logger;

module.exports.setup = function () {
	logger = gn.log.create('lib.connection.delivery');
};

module.exports.PACKET_SCHEMA = '__portal_packet_schema__';

module.exports.Delivery = Delivery;

function Delivery(info, localHandler, sender, limit) {
	this._info = info.address + '/' + info.port;
	this._localHandler = localHandler;
	this._sender = sender;
	this._limit = limit;
}

Delivery.prototype.send = function (dataBytes, nodes) {
	// each branch contains a list of nodes
	const nodeBranches = this._createNodeBranches(nodes);
	// send the command to the first node of all branches
	this._sendToEachNode(nodeBranches, dataBytes);
};

Delivery.prototype._createNodeBranches = function (nodes) {
	var limit = this._limit;
	if (nodes.length <= limit) {
		limit = nodes.length;
	}
	const branches = [];
	var path = 0;
	while (nodes.length) {
		if (path > limit) {
			path = 0;
		}
		if (!branches[path]) {
			branches[path] = [];
		}
		const node = nodes.shift();
		if (node) {
			branches[path].push(node);
			path += 1;
		}
	}
	return branches;
};

Delivery.prototype._sendToEachNode = function (nodeBranches, dataBytes) {
	const nodes = nodeBranches.shift();
	if (!nodes) {
		// no more branch it seems
		return;
	}
	this._send(nodes, dataBytes);
	// next branch
	const that = this;
	setImmediate(function () {
		that._sendToEachNode(nodeBranches, dataBytes);
	});
}; 

Delivery.prototype._send = function (nodes, dataBytes) {
	const node = nodes.shift();
	if (!node) {
		// this should not happen
		const err = new Error('DeliveryError');
		logger.error(
			'Node not found in a branch to send command to',
			err.stack
		);
		return;
	}
	// local?
	if (node === this._info) {
		this._handleLocal(dataBytes);
		/**
		locally handled command MUST pass
		the rest of nodes in the branch to remote
		*/
		if (nodes.length) {
			this._send(nodes, dataBytes);
		}
		return;
	}
	// we assume node is a string: '<address>/<port>'
	const list = node.split('/');
	const addr = list[0];
	const port = list[1];
	this._handleRemote(nodes, addr, port, dataBytes);
};

Delivery.prototype._handleLocal = function (dataBytes) {
	try {
		this._localHandler(dataBytes);
	} catch (error) {
		logger.error(
			'Failed to handle command locally:',
			error
		);		
	}
};

Delivery.prototype._handleRemote = function (nodes, addr, port, dataBytes) {
	try {
		this._sender(nodes, addr, port, dataBytes);
	} catch (error) {
		logger.error(
			'Failed to send command remotely:',
			error
		);
	}
};


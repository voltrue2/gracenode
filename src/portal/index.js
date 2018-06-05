'use strict';

const gn = require('../gracenode');
const announce = require('./announce');
const broker = require('./broker');
const meshNodes = require('./meshnodes');

module.exports = {
	RUDP: broker.RUDP,
	UDP: broker.UDP,
	// internally used methods
	config: config,
	setup: setup,
	// mesh network helper object
	nodes: meshNodes,
	// public methods for mesh network communication
	emit: broker.emit,
	on: on,
	// mesh network methods
	info: broker.info,
	// mesh network node methods
	setNodeValue: announce.setValue,
	nodeExists: announce.nodeExists,
	onAnnounce: announce.onAnnounce,
	onNewNode: announce.onNewNode,
	getNodes: announce.getNodes,
	getAllNodes: announce.getAllNodes
};

function config(conf) {

	if (gn.isCluster() && gn.isMaster()) {
		return;
	}

	announce.config(conf);
	broker.config(conf);
}

function setup(cb) {

	if (gn.isCluster() && gn.isMaster()) {
		return cb();
	}
	
	broker.setup(function () {
		announce.setup(cb);
	});
}

/** @description A mesh network communication event listener
* @param {string} eventName - An event name of
*	mesh network communication event
* @param {function} handler - A listener handler
* @param {function} cb - Indicates as RUDP if given
*	the handler must call "callback" within itself
*/
function on(eventName, handler) {
	broker.on(eventName, handler);
}

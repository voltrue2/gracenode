'use strict';

const gn = require('../gracenode');
const mlink = require('mesh-link');

const RUDP = 0;
const UDP = 1;

var conf;

module.exports = {
    RUDP: RUDP,
    UDP: UDP,
    // internally used methods
    config: config,
    setup: setup,
    // public methods for mesh network communication
    emit: emit,
    on: on,
    // mesh network methods
    info: mlink.info,
    // mesh network node methods
    prepareNodes: mlink.prepareNodes,
    setNodeType: mlink.setType,
    setNodeValue: mlink.setValue,
    nodeExists: mlink.nodeExists,
    onAnnounce: mlink.onUpdate,
    onAnnounced: mlink.onUpdated,
    onNewNodes: mlink.onNewNodes,
    getType: mlink.getType,
    getBackupNodes: mlink.getBackupNodes,
    getNodeValue: mlink.getNodeValue,
    getNodes: mlink.getNodesByType,
    getAllNodes: mlink.getNodeEndPoints
};

function config(_conf) {
    if (gn.isCluster() && gn.isMaster()) {
        return;
    }
    conf = _conf;
}

function setup(cb) {
    if (gn.isCluster() && gn.isMaster()) {
        return cb();
    }
    gn.onExit(function _stopPortal(next) {
        mlink.stop()
        .then(next)
        .catch(next);
    });
    if (conf.type) {
        mlink.setType(conf.type);
    }
    mlink.start(conf)
    .then(cb)
    .catch(cb);
}

/** @description A mesh network communication event listener
* @param {number} eventId - An event ID
* @param {function} handler - A listener handler
* @param {function} cb - Indicates as RUDP if given
*    the handler must call "callback" within itself
*/
function on(eventId, handler) {
    mlink.handler(eventId, handler);
}

/** @description Sends a message to one or more mesh nodes
* @param {number} protocol - 0 for RUDP and 1 for UDP
* @param {number} eventId - An event ID that is pre-defined by .on()
* @param {array} nodes - An array of mesh node addresses and portes [ { address, port } ]
* @param {function} cb - A callback, if you want a response back
*/
function emit(protocol, eventId, nodes, data, cb) {
    switch (protocol) {
        case RUDP:
            mlink.send(eventId, nodes, data, cb);
        break;
        case UDP:
            mlink.usend(eventId, nodes, data, cb);
        break;
        default:
            if (typeof cb === 'function') {
                cb(new Error('InvalidProtocol ' + protocol));
            } else {
                throw new Error('InvalidProtocol ' + protocol);
            }
        break;
    }
}


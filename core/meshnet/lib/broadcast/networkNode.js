'use strict';
// this uses broadcast for mesh network

var broadcaster = require('./broadcaster');

var gn;
var network;

// called from mesh-net/lib/discover
module.exports.setGracenode = function (gnIn) {
	gn = gnIn;
};

// called from mesh-net/lib/discover
module.exports.setup = function (configIn) {
	network = broadcaster;
	network.setGracenode(gn);
	network.setConfig(configIn);
};

// called from mesh-net/lib/discover
module.exports.create = function () {
	return new network.constructor();
};

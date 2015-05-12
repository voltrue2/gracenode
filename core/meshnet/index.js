'use strict';

var name = 'meshnet';
// with broadcast
var discover = require('./lib/broadcast/discover');
// with redis
var flood = require('./lib/redis/flood');

var gn;
var logger;
var enabled = false;
var meshNet;

module.exports.TYPE = discover.TYPE;

module.exports.setup = function (gnIn, cb) {
	gn = gnIn;
	logger = gn.log.create(name);
	var config = gn.config.getOne('meshnet');

	if (!config || !config.enable) {
		logger.verbose('mesh-network is not enabled');
		return cb();
	}

	logger.info('mesh-network enabled');

	var mesh;

	if (config.method === 'redis') {
		mesh = flood;
	} else {
		mesh = discover;
	}

	enabled = true;
	mesh.setGracenode(gn);
	mesh.setup(config);

	meshNet = new mesh.MeshNet();

	gn.registerShutdownTask(name, function (next) {
		meshNet.stop(next);
	});

	meshNet.start(cb);
};

// mesh network is only available for master process or non-cluster process
module.exports.get = function () {
	return meshNet;
};



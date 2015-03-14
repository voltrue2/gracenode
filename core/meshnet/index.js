'use strict';

var name = 'meshnet';
var discover = require('./lib/discover');
var Discover = discover.Discover;

var gn;
var logger;
var enabled = false;
var meshNet;

module.exports.TYPE = discover.TYPE;

module.exports.setup = function (gnIn, cb) {
	gn = gnIn;
	logger = gn.log.create(name);
	var config = gn.config.getOne('meshnet');

	if (!config || !config.enabled) {
		logger.verbose('mesh-network is not enabled');
		return cb();
	}

	logger.info('mesh-network enabled');

	enabled = true;
	discover.setGracenode(gn);
	discover.setup(config);

	meshNet = new Discover();

	gn.registerShutdownTask(name, function (next) {
		meshNet.stop(next);
	});

	meshNet.start(cb);
};

// mesh network is only available for master process or non-cluster process
module.exports.get = function () {
	return meshNet;
};



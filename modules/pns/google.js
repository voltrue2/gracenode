
var gracenode = require('../..');
var log = gracenode.log.create('pns-google');

var config = null;

module.exports.readConfig = function (configIn) {
	if (!configIn.google) {
		log.info('google is not available...');
		return;
	}
	
	config = configIn;
};

module.exports.setup = function (mode, cb) {
	if (!config) {
		return cb();
	}
};

module.exports.connect = function (cb) {
	if (!config) {
		log.warning('google is not available');
		return cb();
	}

	log.verbose('connecting to google...');

	cb();
};


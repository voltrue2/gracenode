
var gracenode = require('../../');
var log = gracenode.log.create('pns');
var apple = require('./apple');
var google = require('./google');

var async = require('async');

var config = null;
var mode = null; // "sandbox" or "live"

module.exports.APLLE = 'apple';
module.exports.GOOGLE = 'google';

/*
{
	"pns": {
		"sandbox": true or false,
		"apple": { "sandbox": {}, "live": {} }, // paths to certificate files .pem
		"google": { "sandbox": "", "live": "" } // paths to API keys
	}
}
*/
module.exports.readConfig = function (configIn) {
	if (!configIn) {
		throw new Error('invalid configurations given:\n' + JSON.stringify(configIn, null, 4));
	}
	
	config = configIn;

	mode = config.sandbox ? 'sandbox' : 'live';

	log.info('service mode: ' + mode);

	apple.readConfig(config);
	google.readConfig(config);
};

module.exports.setup = function (cb) {
	async.waterfall([
		function (callback) {
			apple.setup(mode, callback);
		},
		function (callback) {
			google.setup(mode, callback);
		}
	], cb);
};

module.exports.connect = function (serviceName, cb) {

	log.verbose('connect to "', serviceName, '" [mode: ' + mode + ']');

	switch (serviceName) {
		case module.exports.APPLE:
			return apple.connect(cb);
		case module.exports.GOOGLE:
			return google.connect(cb);
		default:
			return cb(new Error('invalid service provided: ' + serviceName));
	}
};

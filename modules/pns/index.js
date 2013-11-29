
var gracenode = require('../../');
var log = gracenode.log.create('pns');
var apple = require('./apple');
var google = require('./google');

var fs = require('fs');

var config = null;
var mode = null; // "sandbox" or "live"
var service = null;

/*
{
	"pns": {
		"sandbox": true or false,
		"apple": { "sandbox": "", "live": "" }, // paths to certificate files .pem
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

	apple.readConfig(config);
	google.readConfig(config);
};

module.exports.connect = function (serviceName, cb) {

	log.verbose('connect:', serviceName, '[mode: ' + mode + ']');

	switch (serviceName) {
		case 'apple':
			return apple.connect(mode, cb);
		case 'google':
			return google.connect(mode, cb);
		default:
			return cb(new Error('invalid service provided: ' + serviceName));
	}
};

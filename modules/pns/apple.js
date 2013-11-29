
var gracenode = require('../..');
var log = gracenode.log.create('pns-apple');

var tls = require('tls');
var fs = require('fs');
var crypto = require('crypto');
var async = require('async');

var urlDef = { 'sandbox': 'ssl://gateway.sandbox.push.apple.com', 'live': 'ssl://gateway.push.apple.com' };
var port = 2195;
var config = null;
var certPath = null;
var url = null;

module.exports.readConfig = function (configIn) {
	if (!configIn.apple || !configIn.apple.sandbox || !configIn.apple.live) {
		throw new Error('invalid configurations given:\n' + JSON.stringify(configIn));
	}
	
	config = configIn.apple;
};

module.exports.connect = function (mode, cb) {
	
	log.verbose('connecting to apple [' + url + ']...');	

	url = urlDef[mode] || null;
	
	if (!url) {
		return cb(new Error('URL is missing for "' + mode + '" mode'));
	}

	certPath = config[mode] || null;

	if (!certPath) {
		return cb(new Error('certificate path is missing for "' + mode + '" mode'));
	}
	
	log.verbose('certificate path: ' + certPath);
	
	async.waterfall([
		readCertificate,
		startStream
	], cb);

};

function readCertificate(cb) {	
	fs.readFile(certPath, function (error, cert) {
		if (error) {
			return cb(error);
		}
		cb(null, cert);
	});
}

function startStream(cert, cb) {
	cb();
}

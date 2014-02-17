
var gracenode = require('../../');
var log = gracenode.log.create('iap-google');
var fs = require('fs');
var crypto = require('crypto');
var async = require('async');

var sandboxPkey = 'iap-sandbox';
var livePkey = 'iap-live';

var config = null;

var pkeyPath = null;

module.exports.readConfig = function (configIn) {
    if (!configIn || !configIn.googlePublicKeyPath) {
        throw new Error('invalid configurations given:\n' + JSON.stringify(configIn, null, 4));
    }
    config = configIn;
    if (config.sandbox) {
        pkeyPath = gracenode.getRootPath() + configIn.googlePublicKeyPath + sandboxPkey;
    } else {
        pkeyPath = gracenode.getRootPath() + configIn.googlePublicKeyPath + livePkey;
    }
    log.verbose('mode: [' + (config.sandbox ? 'sandbox' : 'live') + ']');
    log.verbose('validation public key path: ' + pkeyPath);
};

// receipt is an object
/*
* receipt = { data: 'receipt data', signature: 'receipt signature' };
*/
module.exports.validatePurchase = function (receipt, cb) {
	if (typeof receipt !== 'object') {
		return cb(new Error('malformed receipt: ' + receipt));
	}
	if (!receipt.data || !receipt.signature) {
		return cb(new Error('missing receipt data:\n' + JSON.stringify(receipt)));
	}

	async.waterfall([
		function (callback) {
			callback(null, receipt);
		},
		getPublicKey,
		validatePublicKey
	], cb);

};

function getPublicKey(receipt, cb) {
	fs.readFile(pkeyPath, function (error, fileData) {
		if (error) {
			return cb(new Error('failed to read public key file: ' + pkeyPath));
		}

		var key = gracenode.lib.chunkSplit(fileData.toString().replace(/\s+$/, ''), 64, '\n'); 

		var pkey = '-----BEGIN PUBLIC KEY-----\n' + key + '-----END PUBLIC KEY-----\n';
		
		log.info('validation public key: ' + pkey);
		
		cb(null, receipt, pkey);
	});	
}

function validatePublicKey(receipt, pkey, cb) {
	var validater = crypto.createVerify('SHA1');
	validater.update(receipt.data);
	var valid = validater.verify(pkey, receipt.signature, 'base64');

	log.info('receipt data:', receipt.data);
	log.info('receipt signature:', receipt.signature);	
	log.info('valid:', valid);

	if (valid) {
		log.info('purchase validated successfully');
		// validated successfully
		var data = JSON.parse(receipt.data);
		data.status = 0;
		return cb(null, receipt, data, true);
	}
	// failed to validate
	log.error('failed to validate purchase');
	cb(null, receipt, { status: 1 }, false);
}

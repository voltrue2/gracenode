var gracenode = require('../../');
var log = gracenode.log.create('iap-google');
var fs = require('fs');
var crypto = require('crypto');

var sandboxPkey = 'iap-sandbox';
var livePkey = 'iap-live';
var config = null;
var pkeyPath = null;
var publicKey;

module.exports.readConfig = function (configIn) {
	config = configIn;
	if (!config) {
		config = {};
	}
	if (config.sandbox) {
		pkeyPath = gracenode.getRootPath() + configIn.googlePublicKeyPath + sandboxPkey;
	} else {
		pkeyPath = gracenode.getRootPath() + configIn.googlePublicKeyPath + livePkey;
	}
	log.verbose('mode: [' + (config.sandbox ? 'sandbox' : 'live') + ']');
	log.verbose('validation public key path: ' + pkeyPath);
};

module.exports.setup = function (cb) {
	fs.readFile(pkeyPath, function (error, fileData) {
		if (error) {
			return cb(new Error('failed to read public key file: ' + pkeyPath));
		}

		var key = gracenode.lib.chunkSplit(fileData.toString().replace(/\s+$/, ''), 64, '\n'); 

		var pkey = '-----BEGIN PUBLIC KEY-----\n' + key + '-----END PUBLIC KEY-----\n';
		
		log.info('validation public key: ' + pkey);
		
		publicKey = pkey;

		cb();
	});	
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
	validatePublicKey(receipt, cb);
};

function validatePublicKey(receipt, cb) {
	var validater = crypto.createVerify('SHA1');
	validater.update(receipt.data);
	var valid = validater.verify(publicKey, receipt.signature, 'base64');

	log.verbose('receipt data:', receipt.data);
	log.verbose('receipt signature:', receipt.signature);	
	log.verbose('valid:', valid);

	if (valid) {
		log.info('purchase validated successfully (google):', data, receipt, valid);
		// validated successfully
		var data = JSON.parse(receipt.data);
		data.status = 0;
		return cb(null, receipt, data, true);
	}
	// failed to validate
	log.error('failed to validate purchase (google):', receipt.data, receipt, valid);
	cb(null, receipt, { status: 1 }, false);
}

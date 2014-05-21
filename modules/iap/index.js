
var gracenode = require('../../');
var log = gracenode.log.create('in-app-purchase');
var crypto = require('crypto');
var async = require('async');

var apple = require('./apple.js');
var google = require('./google.js');

var config = null;
var mysql = null;

// constants
var VALIDATED = module.exports.VALIDATED = 'validated';
var ERROR     = module.exports.ERROR     = 'error';
var PENDING   = module.exports.PENDING   = 'pending';
var HANDLED   = module.exports.HANDLED   = 'handled';
var CANCELED  = module.exports.CANCELED  = 'canceled';

module.exports.readConfig = function (configIn) {
	if (!gracenode.request || !gracenode.mysql) {
		throw new Error('iap module requires built-in request module and mysql module');
	}
	if (!configIn || !configIn.sql) {
        throw new Error('invalid configurations given:\n' + JSON.stringify(configIn, null, 4));
    }
	
	config = configIn;

	mysql = gracenode.mysql.create(config.sql);

	apple.readConfig(config);
	google.readConfig(config);
};

module.exports.setup = function (cb) {
	if (!config.googlePublicKeyPath) {
		// no google iap
		return cb();
	}
	google.setup(cb);
};

// unit test functions
module.exports.testApple = function (receipt, cb) {
	apple.validatePurchase(receipt, function (error, receipt, response) {
		if (error) {
			return cb(error);
		}
		try {
			var validateState = getValidateState(response);
			cb(null, { validateState: validateState, status: PENDING, response: response });
		} catch (e) {
			return cb(e);
		}
	});
};

module.exports.testGoogle = function (receipt, cb) {
	google.validatePurchase(receipt, function (error, receipt, response) {
		if (error) {
			return cb(error);
		}
		try {
			var validateState = getValidateState(response);
			cb(null, { validateState: validateState, status: PENDING, response: response });
		} catch (e) {
			return cb(e);
		}
	});
};

module.exports.isValidated = function (response) {
	if (response && response.validateState) {
		if (response.validateState === VALIDATED) {
			return true;
		}
	}
	return false;
};

module.exports.validateApplePurchase = function (receipt, cb) {
	async.waterfall([
		function (callback) {
			callback(null, receipt, cb);
		}, 
		checkDb,
		apple.validatePurchase,
		storeResponse
	], cb);
};

module.exports.validateGooglePurchase = function (receipt, cb) {
	async.waterfall([
		function (callback) {
			callback(null, receipt, cb);
		}, 
		checkDb,
		google.validatePurchase,
		storeResponse
	], cb);
};

module.exports.updateStatus = function (receipt, status, cb) {
	if (status !== PENDING && status !== CANCELED && status !== HANDLED) {
		return cb(new Error('invalid status given: ' + status));
	}
	var sql = 'UPDATE iap SET status = ?, modtime = ? WHERE receiptHashId = ? AND service = ?';
	var service = (typeof receipt === 'object') ? 'google' : 'apple';
	var params = [
		status,
		new Date().getTime(),
		createReceiptHash(receipt),
		service
	];
	mysql.write(sql, params, function (error) {
		if (error) {
			return cb(error);
		}
		cb();
	});
};

module.exports.createHashId = function (receipt) {
	return createReceiptHash(receipt);
};

function checkDb(receipt, finalCallback, cb) {
	var sql = 'SELECT validateState, status, service, response FROM iap WHERE receiptHashId = ?';
	var hash = createReceiptHash(receipt);
	var params = [hash];
	mysql.searchOne(sql, params, function (error, res) {
		if (error) {
			return cb(error);
		}
		log.info('validated data in database: (receipt hash: ' + hash + ')', res);

		if (res) {
			// check status
			if (res.status === HANDLED || res.status === CANCELED) {
				// status is either handled or canceled > we do nothing in this case...
				return cb(new Error('status has already been ' + res.status));
			}
			// check validation
			if (res.validateState === VALIDATED) {
				// this receipt has been validated by the service provider already
				try {
					res.response = JSON.parse(res.response);
				} catch (e) {
					log.error('response data corrupt:', res);
					return cb(new Error('response data corrupt'));
				}

				return finalCallback(null, res);
			}
		}
		cb(null, receipt);
	});	
}

// FIXME: on duplicate update... not really good. come up with a better way to handle this
function storeResponse(receipt, response, validated, cb) {
	try {
		var validateState = getValidateState(response);
		var sql = 'INSERT INTO iap (receiptHashId, receipt, response, validateState, status, service, created, modtime) VALUES(?, ?, ?, ?, ?, ?, ?, ?)';	
		sql += ' ON DUPLICATE KEY UPDATE response = ?, validateState = ?, modtime = ?';
		var resStr = JSON.stringify(response);
		var now = new Date().getTime();
		var hash = createReceiptHash(receipt);
		var params = [
			hash,
			prepareReceipt(receipt),
			resStr,
			validateState,
			PENDING,
			getService(receipt),
			now,
			now,
			resStr,
			validateState,
			now
		];
		mysql.write(sql, params, function (error) {
			if (error) {
				return cb(error);
			}
			cb(null, { validateState: validateState, status: PENDING, response: response });
		});
	} catch (e) {
		return cb(e);
	}
}

function createReceiptHash(receipt) {
    // google's receipt is an object
	if (typeof receipt === 'object') {
		receipt = JSON.stringify(receipt);
	}
	var sha = crypto.createHash('sha256');
    return sha.update(receipt.toString()).digest('hex');
}

function prepareReceipt(receipt) {
	if (typeof receipt === 'object') {
		return JSON.stringify(receipt);
	}
	return receipt;
}

function getValidateState(response) {
	if (response && response.status === 0) {
		return VALIDATED;
	}
	return ERROR;
}

function getService(receipt) {
	if (typeof receipt === 'object') {
		return 'google';
	}
	return 'apple';
}

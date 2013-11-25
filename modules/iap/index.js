
var gracenode = require('../../');
var log = gracenode.log.create('in-app-purchase');
var crypto = require('crypto');
var async = require('async');

var apple = require('./apple.js');
var google = null;

var mysql = {};

// constants
var VALIDATED = 'validated';
var ERROR = 'error';
var PENDING = 'pending';
var HANDLED = 'handled';
var CANCELED = 'canceled';

module.exports.readConfig = function (configIn) {
	if (!gracenode.request || !gracenode.mysql) {
		throw new Error('iap module requires request module and mysql module');
		return;
	}
	apple.readConfig(configIn);
	mysql.reader = gracenode.mysql.create(config.sql.read);
	mysql.writer = gracenode.mysql.create(config.sql.write);
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

module.exports.updateStatus = function (receipt, status, cb) {
	if (status !== PENDING && status !== CANCELED && status !== HANDLED) {
		return cb(new Error('invalid status given: ' + status));
	}
	var sql = 'UPDATE iap SET status = ?, modtime = ? WHERE receiptHashId = ?';
	var params = [
		status,
		new Date().getTime(),
		createReceiptHash(receipt)
	];
	mysql.writer.write(sql, params, function (error, res) {
		if (error) {
			return cb(error);
		}
		cb();
	});
};

function checkDb(receipt, finalCallback, cb) {
	var sql = 'SELECT validateState, status FROM iap WHERE receiptHashId = ?';
	var hash = createReceiptHash(receipt);
	var params = [hash];
	mysql.reader.searchOne(sql, params, function (error, res) {
		if (error) {
			return cb(error);
		}
		log.info('validated data in database: (receipt hash: ' + hash + ')', res);
		if (res && res.validateState === VALIDATED) {
			// this receipt has been validated by the service provider already
			return finalCallback(null, res);
		}

		cb(null, receipt);
	});	
}

function storeResponse(receipt, response, validated, cb) {
	var sql = 'INSERT INTO iap (receiptHashId, receipt, response, validateState, status, service, created, modtime) VALUES(?, ?, ?, ?, ?, ?, ?, ?)';	
	sql += ' ON DUPLICATE KEY UPDATE response = ?, validateState = ?, modtime = ?';
	var resStr = JSON.stringify(response);
	var validateState = getValidateState(response);
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
	mysql.writer.write(sql, params, function (error) {
		if (error) {
			return cb(error);
		}
		cb(null, { validateState: validateState, status: PENDING });
	});
}

function createReceiptHash(receipt) {
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

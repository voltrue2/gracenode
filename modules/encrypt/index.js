var bcrypt = require('bcrypt');
var gracenode = require('../../');
var log  = gracenode.log.create('encrypt');
var uuid = require('node-uuid');

module.exports.createHash = function (str, cost, cb) {
	bcrypt.genSalt(cost || 10, function (error, salt) {
		if (error) {
			return cb(error);
		}
		bcrypt.hash(str, salt, function (error, hash) {
			if (error) {
				return cb(error);
			}
			cb(null, hash);
		});
	});
};

module.exports.validateHash = function (str, hash, cb) {
	bcrypt.compare(str, hash, function (error, res) {
		if (error) {
			return cb(error);
		}
		cb(null, res);
	});
};

module.exports.createSalt = function (cost, cb) {
	bcrypt.genSalt(cost || 10, function (error, salt) {
		if (error) {
			return cb(error);
		}
		cb(error, salt);
	});
};

module.exports.uuid = function (version, options, buffer, offset) {
	switch (version) {
		case 1: 
			return uuid.v1(options || null, buffer || null, offset || null);
		case 4:
			return uuid.v4(options || null, buffer || null, offset || null);
		default:
			log.warn('Missing \'version\' parameter when generating a UUID.');
			return null;
	}
};

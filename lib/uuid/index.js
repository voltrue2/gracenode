'use strict';

// UUID in raw 128 bit binary
var UUID_LEN = 16;

var nodeUuid = require('node-uuid');

function UUID() {
	this.bytes = new Buffer(UUID_LEN);
	this.string = '';
	this.length = 0;
	this.byteLength = this.bytes.length;
}

UUID.prototype.toString = function () {
	this.string = nodeUuid.unparse(this.bytes);
	this.length = this.string.length;
	return this.string;
};

UUID.prototype.toBytes = function () {
	return this.bytes;
};

UUID.prototype.getLength = function () {
	return this.length;
};

UUID.prototype.getByteLength = function () {
	return this.byteLength;
};

module.exports.create = function (setUUID) {
	var uuid;

	if (Buffer.isBuffer(setUUID) && setUUID.length === UUID_LEN) {
		uuid = new UUID();
		setUUID.copy(uuid.bytes);
		uuid.string = nodeUuid.unparse(uuid.bytes);
		uuid.length = uuid.string.length;
		return uuid;
	}

	if (typeof setUUID === 'string' && setUUID.length === 36) {
		uuid = new UUID();
		nodeUuid.parse(setUUID, uuid.bytes);
		uuid.string = nodeUuid.unparse(uuid.bytes);
		uuid.length = uuid.string.length;
		return uuid;
	}

	if (setUUID instanceof UUID && setUUID.bytes && setUUID.bytes.length === UUID_LEN) {
		uuid = new UUID();
		setUUID.bytes.copy(uuid.byptes);
		uuid.string = nodeUuid.unparse(uuid.bytes);
		uuid.length = uuid.string.length;
		return uuid;
	}

	throw new Error('InvalidUUID');
};

module.exports.v4 = function () {
	var uuid = new UUID();
	
	nodeUuid.v4({}, uuid.bytes);
	uuid.string = nodeUuid.unparse(uuid.bytes);
	uuid.length = uuid.string.length;

	return uuid;
};

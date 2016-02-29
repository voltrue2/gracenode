'use strict';

var UUID_LEN = 16;

var nodeUuid = require('node-uuid');

function UUID() {
	this.bytes = new Buffer(UUID_LEN);
	this.string = '';
}

UUID.prototype.toString = function () {
	this.string = nodeUuid.unparse(this.bytes);
	return this.string;
};

UUID.prototype.create = function (setUUID) {
	var uuid;

	if (Buffer.isBuffer(setUUID) && setUUID.length === UUID_LEN) {
		uuid = new UUID();
		setUUID.copy(uuid.bytes);
		uuid.string = nodeUuid.unparse(uuid.bytes);
		return uuid;
	}

	if (typeof setUUID === 'string' && setUUID.length === 36) {
		uuid = new UUID();
		nodeUuid.parse(setUUID, uuid.bytes);
		uuid.string = nodeUuid.unparse(uuid.bytes);
		return uuid;
	}

	if (setUUID instanceof UUID && setUUID.bytes && setUUID.bytes.length === UUID_LEN) {
		uuid = new UUID();
		setUUID.bytes.copy(uuid.byptes);
		uuid.string = nodeUuid.unparse(uuid.bytes);
		return uuid;
	}

	throw new Error('InvalidUUID');
};

UUID.prototype.v4 = function () {
	var uuid = new UUID();
	
	nodeUuid.v4({}, uuid.bytes);
	uuid.string = nodeUuid.unparse(uuid.bytes);

	return uuid;
};

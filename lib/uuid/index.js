'use strict';

// UUID in raw 128 bit binary
const UUID_LEN = 16;
const UUID_STR_LEN = 32;

var nodeUuid = require('./uuid');

module.exports.UUID_LEN = UUID_LEN;
module.exports.UUID_STR_LEN = UUID_STR_LEN;

function UUID() {
	this.bytes = new Buffer(UUID_LEN);
	this.string = '';
	this.length = 0;
	this.byteLength = this.bytes.length;
}

UUID.prototype.toString = function __uuidToString() {
	this.string = nodeUuid.unparse(this.bytes);
	this.length = this.string.length;
	return this.string;
};

UUID.prototype.toBytes = function __uuidToBytes() {
	return this.bytes;
};

UUID.prototype.getLength = function __uuidGetLength() {
	return this.length;
};

UUID.prototype.getByteLength = function __uuidGetByteLength() {
	return this.byteLength;
};

module.exports.create = function __uuidCreate(setUUID) {
	var uuid;

	if (Buffer.isBuffer(setUUID) && setUUID.length === UUID_LEN) {
		uuid = new UUID();
		setUUID.copy(uuid.bytes);
		uuid.string = nodeUuid.unparse(uuid.bytes);
		uuid.length = uuid.string.length;
		return uuid;
	}

	if (typeof setUUID === 'string' && setUUID.length === UUID_STR_LEN) {
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

module.exports.v4 = function __uuidV4() {
	var uuid = new UUID();
	
	nodeUuid.v4({}, uuid.bytes);
	uuid.string = nodeUuid.unparse(uuid.bytes);
	uuid.length = uuid.string.length;

	return uuid;
};

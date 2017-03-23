'use strict';

const gn = require('../../src/gracenode');
const schemaMap = {};

const UINT8 = 1;
const INT8 = 2;
const UINT16 = 3;
const INT16 = 4;
const UINT32 = 5;
const INT32 = 6;
const DOUBLE = 7;
const STR = 8;
const UINT8_ARR = 9;
const INT8_ARR = 10;
const UINT16_ARR = 11;
const INT16_ARR = 12;
const UINT32_ARR = 13;
const INT32_ARR = 14;
const DOUBLE_ARR = 15;
const STR_ARR = 16;
const BIN = 17;
const UUID = 18;
const UUID_ARR = 19;
const BOOL = 20;
const BOOL_ARR = 21;
const OBJ = 22;

const COMPRESS_TAG = 0xffffffff;
const COMP_BUF = new Buffer(4);
COMP_BUF.writeUInt32BE(COMPRESS_TAG, 0);
const OBJ_TYPE = 0xdeadbeef;

// this value is configurable
var MAX_SIZE = 8000;

var logger;

module.exports.UINT8 = UINT8;
module.exports.INT8 = INT8;
module.exports.UINT16 = UINT16;
module.exports.INT16 = INT16;
module.exports.UINT32 = UINT32;
module.exports.INT32 = INT32;
module.exports.DOUBLE = DOUBLE;
module.exports.STR = STR;
module.exports.UUID = UUID;
module.exports.BOOL = BOOL;
module.exports.UINT8_ARR = UINT8_ARR;
module.exports.INT8_ARR = INT8_ARR;
module.exports.UINT16_ARR = UINT16_ARR;
module.exports.INT16_ARR = INT16_ARR;
module.exports.UINT32_ARR = UINT32_ARR;
module.exports.INT32_ARR = INT32_ARR;
module.exports.DOUBLE_ARR = DOUBLE_ARR;
module.exports.STR_ARR = STR_ARR;
module.exports.UUID_ARR = UUID_ARR;
module.exports.BOOL_ARR = BOOL_ARR;
module.exports.BIN = BIN;
module.exports.OBJ = OBJ;

module.exports.setMaxSize = function (maxSize) {
	if (maxSize) {
		MAX_SIZE = maxSize;
	}
};

module.exports.setup = function () {
	logger = gn.log.create('portal.packer');
};

/***
_schema {
	<prop name>: <data type>,
	{ .... }
}
data type can be another schema name
**/
module.exports.schema = function (name, _schema) {
	if (schemaMap[name]) {
		logger.error('delivery data schema already exists:', name, _schema);
		return false;
	}
	for (var prop in _schema) {
		if (_schema[prop] === undefined || _schema[prop] === null) {
			throw new Error('InvalidDataType[' + name + '.' + prop + ']');
		}
	}
	schemaMap[name] = _schema;
	return true;
};

module.exports.compress = function (packedList) {
	const list = [ COMP_BUF ];
	// 4 bytes is the size of COMP_BUF
	var size = 4;
	for (var i = 0, len = packedList.length; i < len; i++) {
		const buf = new Buffer(4 + packedList[i].length);
		buf.writeUInt32BE(packedList[i].length, 0);
		packedList[i].copy(buf, 4, 0);
		list.push(buf);
		size += buf.length;
	}
	return Buffer.concat(list, size);
};

module.exports.uncompress = function (buf) {
	if (!buf || buf.length <= 4 || buf.readUInt32BE(0) !== COMPRESS_TAG) {
		return null;
	}
	buf = buf.slice(4);
	const total = buf.length;
	const list = [];
	var consumed = 0;
	while (consumed < total) {
		const size = buf.readUInt32BE(consumed);
		consumed += 4;
		const packed = new Buffer(size);
		buf.copy(packed, 0, consumed);
		consumed += size;
		list.push(packed);
	}
	return list;
};

module.exports.pack = function (name, data) {
	const schema = schemaMap[name];
	if (!schema) {
		throw new Error('SchameDoesNotExistForPack:' + name);
	}
	const buf = new Buffer(MAX_SIZE);
	var offset = 0;
	buf.fill(0);
	for (const prop in schema) {
		if (data[prop] === undefined) {
			throw new Error(
				'MissingProperty[' + name + ']:' + prop +
				'\n' + JSON.stringify(data)
			);
		}
		const value = data[prop];
		offset = packAs(schema[prop], value, buf, offset);
	}
	const res = buf.slice(0, offset);
	return res;
};

module.exports.unpack = function (name, buf, _offset, addLength) {
	const schema = schemaMap[name];
	if (!schema) {
		throw new Error('SchemaDoesNotExitForUnpack:' + name);
	}
	const data = {};
	var offset = _offset || 0;
	for (const prop in schema) {
		const type = schema[prop];
		const unpacked = unpackAs(type, buf, offset);
		data[prop] = unpacked.value;
		offset += unpacked.length;
	}
	if (addLength) {
		data._length = _offset ? offset - _offset : offset;
	}
	return data;
};

function packAs(type, value, buf, offset) {
	switch (type) {
		case UINT8:
			buf.writeUInt8(value, offset);
			offset += 1;
			break;
		case INT8:
			buf.writeInt8(value, offset);
			offset += 1;
			break;
		case BOOL:
			var boolVal = 0;
			if (value === true) {
				boolVal = 1;
			}
			buf.writeInt8(boolVal, offset);
			offset += 1;
			break;
		case UINT16:
			buf.writeUInt16BE(value, offset);
			offset += 2;
			break;
		case INT16:
			buf.writeInt16BE(value, offset);
			offset += 2;
			break;
		case UINT32:
			buf.writeUInt32BE(value, offset);
			offset += 4;
			break;
		case INT32:
			buf.writeInt32BE(value, offset);
			offset += 4;
			break;
		case DOUBLE:
			buf.writeDoubleBE(value, offset);
			offset += 8;
			break;
		case STR:
			buf.writeUInt32BE(value.length, offset);
			offset += 4;
			buf.write(value, offset);
			offset += value.length;
			break;
		case OBJ:
			// let it throw an exception if it has to...
			value = JSON.stringify(value);
			buf.writeUInt32BE(value.length, offset);
			offset += 4;
			buf.write(value, offset);
			offset += value.length;
			break;
		case UUID:
			const uuid = gn.lib.uuid.create(value).toBytes();
			uuid.copy(buf, offset);
			offset += 16;
			break;
		case UINT8_ARR:
		case INT8_ARR:
		case UINT16_ARR:
		case INT16_ARR:
		case UINT32_ARR:
		case INT32_ARR:
		case DOUBLE_ARR:
		case STR_ARR:
		case UUID_ARR:
		case BOOL_ARR:
			offset = packArrayAs(type, value, buf, offset);
			break;
		case BIN:
			if (!value) {
				offset = packNull(buf, offset);
			} else {
				if (typeof value === 'string') {
					buf.writeUInt32BE(value.length, offset);
					offset += 4;
					buf.write(value, offset);
					offset += value.length;
				} else {
					const byteLen = Buffer.byteLength(value);
					buf.writeUInt32BE(byteLen, offset);
					offset += 4;
					value.copy(buf, offset, 0);
					offset += byteLen;
				}
			}
			break;
		default:
			var schema = schemaMap[type];
			if (!schema) {
				throw new Error('InvalidDataTypeForPack:' + type);
			}
			if (!value) {
				offset = packNull(buf, offset);
			} else {
				var packed = module.exports.pack(type, value);
				buf.writeUInt32BE(OBJ_TYPE, offset);
				offset += 4;
				packed.copy(buf, offset, 0);
				offset += packed.length;
			}
			break;
	}
	return offset;
}

function packNull(buf, offset) {
	buf.writeUInt32BE(0, offset);
	offset += 4;
	return offset;
}

function packArrayAs(type, value, buf, offset) {
	var i;
	const len = value.length;
	buf.writeUInt16BE(len, offset);
	offset += 2;
	switch (type) {
		case UINT8_ARR:
			for (i = 0; i < len; i++) {
				buf.writeUInt8(value[i], offset);
				offset += i;
			}
			break;
		case INT8_ARR:
			for (i = 0; i < len; i++) {
				buf.writeInt8(value[i], offset);
				offset += i;
			}
			break;
		case BOOL_ARR:
			for (i = 0; i < len; i++) {
				var boolVal = 0;
				if (value[i] === true) {
					boolVal = 1;
				}
				buf.writeInt8(boolVal, offset);
				offset += 1;
			}
			break;
		case UINT16_ARR:
			for (i = 0; i < len; i++) {
				buf.writeUInt16BE(value[i], offset);
				offset += i * 2;
			}
			break;
		case INT16_ARR:
			for (i = 0; i < len; i++) {
				buf.writeInt16BE(value[i], offset);
				offset += i * 2;
			}
			break;
		case UINT32_ARR:
			for (i = 0; i < len; i++) {
				buf.writeUInt32BE(value[i], offset);
				offset += i * 4;
			}
			break;
		case INT32_ARR:
			for (i = 0; i < len; i++) {
				buf.writeInt32BE(value[i], offset);
				offset += i * 4;
			}
			break;
		case DOUBLE_ARR:
			for (i = 0; i < len; i++) {
				buf.writeDoubleBE(value[i], offset);
				offset += i * 8;
			}
			break;
		case STR_ARR:
			for (i = 0; i < len; i++) {
				const strlen = value[i].length;
				buf.writeUInt32BE(strlen, offset);
				offset += 4;
				buf.write(value[i], offset);
				offset += strlen;
			}
			break;
		case UUID_ARR:
			for (i = 0; i < len; i++) {
				const uuid = gn.lib.uuid.create(value[i]).toBytes();
				uuid.copy(buf, offset, 0);
				offset += 16;
			}
			break;
	}
	return offset;
}

function unpackAs(type, buf, offset) {
	var value;
	var len;
	switch (type) {
		case UINT8:
			value = buf.readUInt8(offset);
			len = 1;
			break;
		case INT8:
			value = buf.readInt8(offset);
			len = 1;
			break;
		case BOOL:
			value = buf.readInt8(offset);
			len = 1;
			if (value === 1) {
				value = true;
			} else {
				value = false;
			}
			break;
		case UINT16:
			value = buf.readUInt16BE(offset);
			len = 2;
			break;
		case INT16:
			value = buf.readInt16BE(offset);
			len = 2;
			break;
		case UINT32:
			value = buf.readUInt32BE(offset);
			len = 4;
			break;
		case INT32:
			value = buf.readInt32BE(offset);
			len = 4;
			break;
		case DOUBLE:
			value = buf.readDoubleBE(offset);
			len = 8;
			break;
		case STR:
			const size = buf.readUInt32BE(offset);
			var strbuf = new Buffer(size);
			buf.copy(strbuf, 0, offset + 4);
			value = strbuf.toString();
			len = 4 + size;
			break;
		case OBJ:
			var objbuf = new Buffer(buf.readUInt32BE(offset));
			buf.copy(objbuf, 0, offset + 4);
			// let it throw an exception if it has to
			value = JSON.parse(objbuf);
			len = 4 + objbuf.length;
			break;
		case UUID:
			const uuid = new Buffer(16);
			buf.copy(uuid, 0, offset);
			value = gn.lib.uuid.create(uuid).toString();
			len = 16;
			break;
		case UINT8_ARR:
		case INT8_ARR:
		case UINT16_ARR:
		case INT16_ARR:
		case UINT32_ARR:
		case INT32_ARR:
		case DOUBLE_ARR:
		case STR_ARR:
		case UUID_ARR:
		case BOOL_ARR:
			var unpacked = unpackArrayAs(type, buf, offset);
			value = unpacked.value;
			len = unpacked.length;
			break;
		case BIN:
			const bsize = buf.readUInt32BE(offset);
			if (!bsize) {
				value = null;
				len = 4;
			} else {
				value = new Buffer(bsize);
				buf.copy(value, 0, offset + 4);
				len = value.length + 4;
			}
			break;
		default:
			var schema = schemaMap[type];
			if (!schema) {
				throw new Error('InvalidDataTypeForUnpack:' + type);
			}
			if (buf.readUInt32BE(offset) === OBJ_TYPE) {
				offset += 4;
				value = module.exports.unpack(type, buf, offset, true);
				len = value._length;
				delete value._length;
			} else {
				value = null;
				len = 0;
			}
			break;
	}
	return { value: value, length: len };
}

function unpackArrayAs(type, buf, offset) {
	var len = 2; // starts w/ b/c of the header size
	var i;
	var list = [];
	var arrlen = buf.readUInt16BE(offset);
	offset += 2;
	switch (type) {
		case UINT8_ARR:
			for (i = 0; i < arrlen; i++) {
				list.push(buf.readUInt8(offset + i));		
				len += 1;
			}
			break;
		case INT8_ARR:
			for (i = 0; i < arrlen; i++) {
				list.push(buf.readInt8(offset + i));		
				len += 1;
			}
			break;
		case BOOL_ARR:
			for (i = 0; i < arrlen; i++) {
				var val = buf.readInt8(offset + i);
				if (val === 1) {
					val = true;
				} else {
					val = false;
				}
				list.push(val);
				len += 1;
			}
			break;
		case UINT16_ARR:
			for (i = 0; i < arrlen; i++) {
				list.push(buf.readUInt16BE(offset + (i * 2)));		
				len += 2;
			}
			break;
		case INT16_ARR:
			for (i = 0; i < arrlen; i++) {
				list.push(buf.readInt16BE(offset + (i * 2)));		
				len += 2;
			}
			break;
		case UINT32_ARR:
			for (i = 0; i < arrlen; i++) {
				list.push(buf.readUInt32BE(offset + (i * 4)));		
				len += 4;
			}
			break;
		case INT32_ARR:
			for (i = 0; i < arrlen; i++) {
				list.push(buf.readInt32BE(offset + (i * 4)));		
				len += 4;
			}
			break;
		case DOUBLE_ARR:
			for (i = 0; i < arrlen; i++) {
				list.push(buf.readDoubleBE(offset + (i * 8)));		
				len += 8;
			}
			break;
		case STR_ARR:
			var strbuf = new Buffer(MAX_SIZE);
			for (i = 0; i < arrlen; i++) {
				var size = buf.readUInt32BE(offset);
				offset += 4;
				len += 4;
				strbuf.fill(0);
				buf.copy(strbuf, 0, offset);
				offset += size;
				len += size;
				list.push(strbuf.slice(0, size).toString());
			}
			break;
		case UUID_ARR:
			var uuid = new Buffer(16);
			for (i = 0; i < arrlen; i++) {
				uuid.fill(0);
				buf.copy(uuid, 0, offset);
				offset += 16;
				len += 16;
				list.push(gn.lib.uuid.create(uuid).toString());
			}
			break;
	}
	return { value: list, length: len };
}


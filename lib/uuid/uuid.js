'use strict';

const _Buffer = require('../../src/buffer');
var crypto = require('crypto');
var result = createByte2Hex();
const hex2Byte = result.hex2Byte;
const byte2Hex = result.byte2Hex;

module.exports.v4 = function __uuidCreateV4(options, buffer, offset) {
	var initVal = buffer && offset || 0;
	
	if (typeof options === 'string') {
		buffer = (options === 'binary') ? _Buffer.alloc(16) : null;
	}

	options = options || {};

	var rnds = options.random || (options.rng || rng)();

	// pre 4.4 set bits for version and `clock_seq_hi_and_reserverd`
	rnds[6] = (rnds[6] & 0x0f) | 0x40;
	rnds[8] = (rnds[8] & 0x3f) | 0x80;

	// crypto bytes to buffer, if provided
	if (buffer) {
		for (var i = 0; i < 16; i++) {
			buffer[initVal + i] = rnds[i];
		}
	}

	return buffer || module.exports.unparse(rnds);
};

module.exports.parse = function __uuidParse(str, buf, offset) {
	var initVal = (buf && offset) || 0;
	var i = 0;
	buf = buf || [];
	str.toLowerCase().replace(/[0-9a-f]{2}/g, function (oct) {
		// do not overflow
		if (i < 16) {
			buf[initVal + i++] = byte2Hex[oct];
		}
	});

	// zero out remaining bytes if string was too short
	while (i < 16) {
		buf[initVal + i++] = 0;
	}

	return buf;
};

module.exports.unparse = function __uuidUnparse(buf, offset) {
	var i = offset || 0;
	var bth = hex2Byte.concat([]);
	return bth[buf[i++]] + bth[buf[i++]] +
		bth[buf[i++]] + bth[buf[i++]] +
		bth[buf[i++]] + bth[buf[i++]] +
		bth[buf[i++]] + bth[buf[i++]] +
		bth[buf[i++]] + bth[buf[i++]] +
		bth[buf[i++]] + bth[buf[i++]] +
		bth[buf[i++]] + bth[buf[i++]] +
		bth[buf[i++]] + bth[buf[i++]];
};

function rng() {
	return crypto.randomBytes(16);
}

// map for number <-> hext string conversion
function createByte2Hex() {
	var res = {
		hex2Byte: [],
		byte2Hex: {}
	};
	res.hex2Byte.length = 256;
	for (var i = 0; i < 256; i++) {
		res.hex2Byte[i] = (i + 0x100).toString(16).substr(1);
		res.byte2Hex[res.hex2Byte[i]] = i;
	}
	return res;
}

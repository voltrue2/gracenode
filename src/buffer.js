'use strict';

if (Buffer.alloc) {
	module.exports.alloc = alloc;
} else {
	// older node.js: supporting deprecated method
	module.exports.alloc = newBuffer;
}

function newBuffer(size, encoding) {
	if (encoding) {
		return new Buffer(size, encoding);
	}
	return new Buffer(size);
}

function alloc(mixed, encoding) {
	if (encoding) {
		return Buffer.from(mixed, encoding);
	} else if (typeof mixed !== 'number') {
		return Buffer.from(mixed);
	}
	return Buffer.alloc(mixed);
}

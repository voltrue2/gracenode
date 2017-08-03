'use strict';

const _Buffer = require('../src/gracenode');

// bitwise XOR

module.exports = function __xor(a, b) {
	var res = [];
	var i;
	
	if (!Buffer.isBuffer(a)) {
		a = _Buffer.alloc(a);
	}
	if (!Buffer.isBuffer(b)) {
		b = _Buffer.alloc(b);
	}

	var alen = a.length;
	var blen = b.length;

	if (alen > blen) {
		for (i = 0; i < blen; i++) {
			res.push(a[i] ^ b[i]);
		}
		return _Buffer.alloc(res);
	}
	
	for (i = 0; i < alen; i++) {
		res.push(a[i] ^ b[i]);
	}
	return _Buffer.alloc(res);
};

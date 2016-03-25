'use strict';

// bitwise XOR

module.exports = function (a, b) {
	var res = [];
	var i;
	
	if (!Buffer.isBuffer(a)) {
		a = new Buffer(a);
	}
	if (!Buffer.isBuffer(b)) {
		b = new Buffer(b);
	}

	var alen = a.length;
	var blen = b.length;

	if (alen > blen) {
		for (i = 0; i < blen; i++) {
			res.push(a[i] ^ b[i]);
		}
		return new Buffer(res);
	}
	
	for (i = 0; i < alen; i++) {
		res.push(a[i] ^ b[i]);
	}
	return new Buffer(res);
};

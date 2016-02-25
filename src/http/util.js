'use strict';

exports.fmt = function (name, val) {
	if (name === 'url') {
		val = decodeURI(val);
	}
	return '(' + name + ':' + val + ')';
};

'use strict';

exports.fmt = function __httpUtilFmt(name, val) {
	if (name === 'url') {
		val = decodeURI(val);
	}
	return '(' + name + ':' + val + ')';
};

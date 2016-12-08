'use strict';

exports.create = function __errorCreate(errCode, errMsg) {
	const str = '<' + errCode + '> ' + errMsg;
	return new Error(str);
};

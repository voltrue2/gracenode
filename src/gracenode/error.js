'use strict';

exports.create = function errorCreate(errCode, errMsg) {
	var str = '<' + errCode + '> ' + errMsg;
	return new Error(str);
};

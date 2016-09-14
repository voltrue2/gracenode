'use strict';

exports.create = function __errorCreate(errCode, errMsg) {
	var str = '<' + errCode + '> ' + errMsg;
	return new Error(str);
};

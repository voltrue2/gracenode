'use strict';

exports.create = function (errCode, errMsg) {
	var str = '<' + errCode + '> ' + errMsg;
	return new Error(str);
};

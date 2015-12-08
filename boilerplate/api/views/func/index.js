'use strict';

var gn = require('gracenode');

exports.showToday = function (val) {
	var dt = gn.lib.createDateTime(val);
	return dt.format('m/d/Y H:M:S');
};

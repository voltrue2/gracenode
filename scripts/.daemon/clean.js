'use strict';

var gn = require('gracenode');
var lib = require('./utils/lib');
var Status = require('./utils/status').Status;

module.exports = function () {
	// listener for exceptions
	gn.on('uncaughtException', gn.exit);
	// try to clean up
	var status = new Status();
	status.clean(function (error, cleaned) {
		if (error) {
			return status.end(error);
		}
		if (cleaned) {
			console.log(lib.color(
				'all detached daemon socket files have been removed',
				lib.COLORS.LIGHT_BLUE
			));
		} else {
			console.log(lib.color(
				'no detached daemon socket files to be removed',
				lib.COLORS.PURPLE
			));
		}
		status.end();
	});
};

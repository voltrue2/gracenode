'use strict';

var Lint = require('../lib/lint').Lint;
var print = require('../lib/print');

exports.start = function (fileList, ignorelist, cb) {
	var lint = new Lint(fileList, ignorelist);
	lint.run(function (error) {
		if (error) {
			print.error(print.r(error.message));
			return cb(error);
		}
		cb();
	});
};

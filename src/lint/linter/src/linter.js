'use strict';

var Lint = require('../lib/lint').Lint;
var print = require('../lib/print');

exports.start = function __lintLinter(fileList, ignorelist, cb) {
	var lint = new Lint(fileList, ignorelist);
	lint.run(function __lintLinterOnRun(error) {
		if (error) {
			print.error(print.r(error.message));
			return cb(error);
		}
		cb();
	});
};

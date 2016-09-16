'use strict';

var linter = require('./linter');

module.exports = function __lintIndex(path, ignorelist, cb) {
	linter.start(path, ignorelist, function __lintIndexOnStart(error) {
		if (error) {
			return cb(error);
		}
		cb();
	});
};

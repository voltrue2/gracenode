'use strict';

var linter = require('./linter');

module.exports = function (path, ignorelist, cb) {
	linter.start(path, ignorelist, function (error) {
		if (error) {
			return cb(error);
		}
		cb();
	});
};

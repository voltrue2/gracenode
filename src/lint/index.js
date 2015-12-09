'use strict';

var linter = require('./linter');

module.exports = function (path, cb) {
	linter.start(path, function (error) {
		if (error) {
			return cb(error);
		}
		cb();
	});
};

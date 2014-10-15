var gn = require('gracenode');
var logger = gn.log.create();

exports.log = function () {
	logger.debug('I can log correctly with default log name!');
};

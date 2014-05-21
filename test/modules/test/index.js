var gn = require('../../../');
var logger = gn.log.create('modules/test');

module.exports.readConfig = function () {
	logger.info('readConfig executed');
};

module.exports.setup = function (cb) {
	logger.info('setup executed');
	cb();
};

module.exports.loaded = function () {
	return true;
};

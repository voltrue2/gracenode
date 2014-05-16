var gn = require('../../../');
var logger = gn.log.create('overridden-mysql');

module.exports.readConfig = function () {
	logger.info('overriden view.readConfig');
};

module.exports.setup = function (cb) {
	logger.info('overridden view.setup');
	cb();
};

module.exports.test = 'test override';

var gn = require('../../../');
var logger = gn.log.create('modules/test');

gn.defineOption('-R', 'Option given from mocha', function (val) {
	var logger = gn.log.create('argv');
	logger.debug('-R caught from test module:', val);
});


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

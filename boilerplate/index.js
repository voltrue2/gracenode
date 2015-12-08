'use strict';

var gn = require('gracenode');

gn.config(require(gn.getRootPath() + 'configs/config.json'));

gn.use('views', require(gn.getRootPath() + 'api/views'));
gn.use('api', require(gn.getRootPath() + 'api'));

gn.start(function () {
	var logger = gn.log.create();
	logger.info('gracenode is now ready');
});

'use strict';

var gn = require('gracenode');

gn.config(require(gn.getRootPath() + 'configs/config.json'));
gn.use('views', 'api/views');

gn.start(function () {
	var logger = gn.log.create();
	logger.info('gracenode is now ready');
	require(gn.getRootPath() + 'api');
});

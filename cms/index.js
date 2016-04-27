'use strict';

var gn = require('gracenode');

gn.config(require(gn.getRootPath() + 'configs/config.json'));

gn.use('views', require(gn.getRootPath() + 'api/views'));
gn.use('api', require(gn.getRootPath() + 'api'));
gn.use('mysql', require(gn.getRootPath() + 'modules/mysql'));

gn.start(function () {
	var logger = gn.log.create();
	logger.info('gracenode CMS is now ready');
});

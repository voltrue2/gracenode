var gn = require('../');
var prefix = require('./prefix');
var assert = require('assert');

describe('gracenode initialization ->', function () {
	
	it('Can set up gracenode modules', function (done) {

		console.log('**NOTICE: This test requires in-app-purchase module and async module installed in ../gracenode/node_modules/ to work properly');
	
		gn.setConfigPath(prefix + 'gracenode/test/configs/');
		gn.setConfigFiles(['setup.json']);

		gn.addModulePath(prefix + 'gracenode/test/modules/');
	
		// test built-in module use
		gn.use('encrypt');

		// test external module use
		gn.use('test');

		// test 3rd party node module use with custom driver
		gn.use('in-app-purchase', { name: null, driver: gn.require(prefix + 'gracenode/test/drivers/in-app-purchase') });

		// test 3rd party node module use with alternate name
		gn.use('async', { name: 'async2' });

		gn.on('setup.config', function () {
			var sd = gn.config.getOne('modules.gracenode-staticdata');
			sd.path = prefix + sd.path;
			var sv = gn.config.getOne('modules.gracenode-server');
			sv.controllerPath = prefix + sv.controllerPath;
		});

		// test gracenode module use
		gn.use('gracenode-mysql');
		gn.use('gracenode-iap');
		gn.use('gracenode-staticdata');
		gn.use('gracenode-encrypt');
		gn.use('gracenode-cron');
		gn.use('gracenode-server');
		gn.use('gracenode-view');
		gn.use('gracenode-request');
		gn.use('gracenode-udp');
		gn.use('gracenode-session');
		gn.use('gracenode-wallet');
		gn.use('gracenode-memcache');

		gn.setup(function (error) {
			assert.equal(error, undefined);
			assert(gn.encrypt.uuid);
			assert(gn.test.loaded());
			assert(gn.inAppPurchase.validate);
			assert(gn.async2);
			assert(gn.iap);
			assert(gn.mysql);
			assert(gn.staticdata.create);
			assert(gn.encrypt.uuid);
			assert(gn.cron.create);
			assert(gn.memcache.create);
			done();
		});
			
	});

	it('Can get iap module schema SQL', function (done) {
		gn.getModuleSchema('gracenode-iap', function (error, sqlList) {
			assert.equal(error, undefined);
			assert(sqlList.length);
			done();
		});
	});

});

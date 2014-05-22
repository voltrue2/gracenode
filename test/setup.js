var gn = require('../');
var assert = require('assert');

describe('gracenode initialization ->', function () {
	
	it('Can set up gracenode modules', function (done) {

		console.log('**WARNING** This test requires in-app-purchase module and async module installed in ../gracenode/node_modules/ to work properly');
	
		gn.setConfigPath('node_modules/gracenode/test/configs/');
		gn.setConfigFiles(['setup.json']);

		gn.addModulePath('node_modules/gracenode/test/modules/');
	
		// test built-in module use
		gn.use('encrypt');

		// test external module use
		gn.use('test');

		// test 3rd party node module use with custom driver
		gn.use('in-app-purchase', { name: null, driver: gn.require('node_modules/gracenode/test/drivers/in-app-purchase') });

		// test 3rd party node module use with alternate name
		gn.use('async', { name: 'async2' });

		// test gracenode module use
		gn.use('gracenode-mysql');
		gn.use('gracenode-iap');
		gn.use('gracenode-staticdata');
		gn.use('gracenode-encrypt');
		gn.use('gracenode-cron');
		gn.use('gracenode-server');

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
			gn.server.start();
			done();
		});
			
	});

});

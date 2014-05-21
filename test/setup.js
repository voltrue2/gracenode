var gn = require('../');
var assert = require('assert');

describe('gracenode initialization ->', function () {
	
	it('Can set up gracenode', function (done) {

		console.log('**WARNING** This test requires in-app-purchase module and async module installed in ../gracenode/node_modules/ to work properly');
	
		gn.setConfigPath('gracenode/test/configs/');
		gn.setConfigFiles(['setup.json']);

		gn.addModulePath('gracenode/test/modules/');

		// test override use
		gn.override('mysql');
	
		// test built-in module use
		gn.use('encrypt');

		// test external module use
		gn.use('test');

		// test 3rd party node module use with custom driver
		gn.use('in-app-purchase', { name: null, driver: gn.require('gracenode/test/drivers/in-app-purchase') });

		// test 3rd party node module use with alternate name
		gn.use('async', { name: 'async2' });

		gn.setup(function (error) {
			assert.equal(error, undefined);
			assert.equal(gn.mysql.test, 'test override');
			assert(gn.encrypt.uuid);
			assert(gn.test.loaded());
			assert(gn.inAppPurchase.validate);
			assert(gn.async2);
			done();
		});
			
	});

});

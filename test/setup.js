var gn = require('../');
var assert = require('assert');

describe('gracenode initialization ->', function () {
	
	it('Can set up gracenode', function (done) {
	
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
		gn.use('in-app-purchase', gn.require('gracenode/test/drivers/in-app-purchase'));
	
		// test 3rd part node module with bilt-in driver
		gn.use('redis');

		gn.setup(function (error) {
			assert.equal(error, undefined);
			assert.equal(gn.mysql.test, 'test override');
			assert(gn.encrypt.uuid);
			assert(gn.test.loaded());
			assert(gn.inAppPurchase.validate);
			assert(gn.redis);
			done();
		});
			
	});

});

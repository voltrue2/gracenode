var assert = require('assert');

describe('gracenode initialization ->', function () {
	
	it('Can set up gracenode', function (done) {
	
		var gn = require('../');

		gn.setConfigPath('node_modules/gracenode/test/configs/');
		gn.setConfigFiles(['index.json']);

		gn.addModulePath('node_modules/gracenode/test/modules/');

		// test override
		gn.override('view');

		gn.setup(function (error) {
			assert.equal(error, undefined);
			assert.equal(gn.view.test, 'test override');
			done();
		});
			
	});	

});

var assert = require('assert');

describe('gracenode initialization ->', function () {
	
	it('Can set up gracenode', function (done) {
	
		var gn = require('../');

		gn.setConfigPath('node_modules/gracenode/test/configs/');
		gn.setConfigFiles(['index.json']);

		gn.setup(function (error) {
			assert.equal(error, undefined);
			done();
		});
			
	});	

});

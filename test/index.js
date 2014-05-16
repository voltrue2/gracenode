var gn = require('../');
var assert = require('assert');

describe('gracenode initialization ->', function () {
	
	it('Can set up gracenode', function (done) {
	
		gn.setConfigPath('node_modules/gracenode/test/configs/');
		gn.setConfigFiles(['index.json']);

		gn.addModulePath('node_modules/gracenode/test/modules/');

		// test override
		gn.override('mysql');
		
		gn.setup(function (error) {
			assert.equal(error, undefined);
			assert.equal(gn.mysql.test, 'test override');
			done();
		});
			
	});
	
	it('Tests all modules', function () {
		gn.require('node_modules/gracenode/test/view');	
		gn.require('node_modules/gracenode/test/mongodb');	
		gn.require('node_modules/gracenode/test/encrypt');	
		gn.require('node_modules/gracenode/test/staticdata');	
		gn.require('node_modules/gracenode/test/server');	
	});

});

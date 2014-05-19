var gn = require('../');
var assert = require('assert');

describe('gracenode initialization ->', function () {
	
	it('Can set up gracenode', function (done) {
	
		gn.setConfigPath('gracenode/test/configs/');
		gn.setConfigFiles(['index.json']);

		gn.addModulePath('gracenode/test/modules/');

		// test override
		gn.override('mysql');
		
		gn.setup(function (error) {
			assert.equal(error, undefined);
			assert.equal(gn.mysql.test, 'test override');
			done();
		});
			
	});

	it('Can get SQL schema', function (done) {
		gn.getModuleSchema('wallet', function (error, sqlList) {
			assert.equal(error, undefined);
			assert.notEqual(sqlList.length, 0);
			done();
		});
	});
	
	it('Tests all modules', function () {
		gn.require('gracenode/test/view');	
		gn.require('gracenode/test/mongodb');	
		gn.require('gracenode/test/encrypt');	
		gn.require('gracenode/test/staticdata');	
		gn.require('gracenode/test/server');	
	});

});

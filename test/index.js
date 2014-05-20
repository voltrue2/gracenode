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

	it('Can generate random int', function () {
		var total = 100;
		var one = 0;
		var zero = 0;
		for (var i = 0; i < total; i++) {
			var rand = gn.lib.randomInt(0, 1);
			if (rand) {
				one++;
			} else {
				zero++;
			}
		}
		// roughly 50%
		if (one < 40 || one > 60 ) {
			throw new Error('inaccurate randomness');
		}
	});

	it('Can generate random float', function () {
		var total = 100;
		var min = 0;
		var max = 0;
		for (var i = 0; i < total; i++) {
			var rand = gn.lib.randomFloat(0.1, 0.2);
			if (rand > 0.1) {
				min++;
			} else {
				max++;
			}
		}
	});
	
	it('Tests all modules', function () {
		gn.require('gracenode/test/view');	
		gn.require('gracenode/test/mongodb');	
		gn.require('gracenode/test/encrypt');	
		gn.require('gracenode/test/staticdata');	
		gn.require('gracenode/test/server');	
	});

});

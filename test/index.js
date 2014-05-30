var gn = require('../');
var prefix = require('./prefix');
var assert = require('assert');

describe('gracenode initialization ->', function () {
	
	it('Can set up gracenode', function (done) {
	
		gn.setConfigPath(prefix + 'gracenode/test/configs/');
		gn.setConfigFiles(['index.json']);

		gn.addModulePath(prefix + 'gracenode/test/modules/');
		
		gn.setup(function (error) {
			assert.equal(error, undefined);
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
	
	it('Tests all modules', function () {
		gn.require(prefix + 'gracenode/test/view');	
		gn.require(prefix + 'gracenode/test/mongodb');	
		gn.require(prefix + 'gracenode/test/encrypt');	
		gn.require(prefix + 'gracenode/test/staticdata');	
	});

});

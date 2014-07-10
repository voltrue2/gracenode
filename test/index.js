var gn = require('../');
var prefix = require('./prefix');
var assert = require('assert');

describe('gracenode initialization ->', function () {
	
	it('Can set up gracenode modules', function (done) {

		console.log('**NOTICE: This test requires async module installed in ../gracenode/node_modules/ to work properly');
	
		gn.setConfigPath(prefix + 'gracenode/test/configs/');
		gn.setConfigFiles(['setup.json']);

		gn.addModulePath(prefix + 'gracenode/test/modules/');

		// test external module use
		gn.use('test');

		// test externam module with hyphnes
		gn.use('test-me');

		// test driver
		gn.use('test-driver', { driver: gn.require(prefix + 'gracenode/test/drivers/test-driver') });

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

		// test prefix of log
		gn.on('setup.log', function () {
			gn.log.setPrefix('UNIT TEST');
		});

		gn.defineOption('-s', 'Option given from mocha', function (val) {
			var logger = gn.log.create('argv');
			logger.debug('-s caught:', val);
		});
		gn.defineOption('-R', 'Option given from mocha', function (val) {
			var logger = gn.log.create('argv');
			logger.debug('-R caught:', val);
		});

		gn.setup(function (error) {
			// test argv
			assert.equal(gn.argv('-s'), 10);
			assert.equal(gn.argv('-R'), 'spec');
			// test the rest
			assert.equal(error, undefined);
			assert(gn.encrypt.uuid);
			assert(gn.test.loaded());
			assert(gn.testMe);
			assert(gn.testDriver.test);
			assert(gn.async2);
			assert(gn.iap);
			assert(gn.mysql);
			assert(gn.staticdata.create);
			assert(gn.encrypt.uuid);
			assert(gn.cron.create);
			assert(gn.memcache.create);

			var logger = gn.log.create('test');
			logger.verbose('test');
			logger.debug('test');
			logger.trace('test');
			logger.info('test');
			logger.warn('test');
			logger.error('test');
			logger.fatal('test');

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

	it('Can clone objects with all properties', function () {
		var original = {
			a: 100,
			b: 'B',
			c: [1,2,3]
		};
		var cloned = gn.lib.cloneObj(original);
		assert.equal(original.a, cloned.a);
		assert.equal(original.b, cloned.b);
		assert.equal(JSON.stringify(original.c), JSON.stringify(cloned.c));
	});

	it('Can clone objects with selected properties', function () {
		var original = {
			a: 100,
			b: 'B',
			c: [1,2,3]
		};
		var cloned = gn.lib.cloneObj(original, ['a', 'b']);
		assert.equal(original.a, cloned.a);
		assert.equal(original.b, cloned.b);
		assert.equal(cloned.c, undefined);
	});

	it('Can dynamically set a configuration value', function () {
		gn.config.set('testConfig.bool', true);
		assert.equal(gn.config.getOne('testConfig.bool'), true);
	});

	it('Can dynamically set configuration values', function () {
		gn.config.set('testConfig.blah.1', 10000);
		assert.equal(gn.config.getOne('testConfig.blah.1'), 10000);
	});

});

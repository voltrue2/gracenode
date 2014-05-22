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
		gn.use('gracenode-view');
		gn.use('gracenode-request');
		gn.use('gracenode-udp');
		gn.use('gracenode-session');
		gn.use('gracenode-wallet');

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
			done();
		});
			
	});

	it('Can get iap module schema SQL', function (done) {
		gn.getModuleSchema('iap', function (error, sqlList) {
			assert.equal(error, undefined);
			assert(sqlList.length);
			done();
		});
	});

	it('Can start a server', function () {
		gn.server.start();
	});

	it('Can load a view content', function (done) {
		var view = gn.view.create();
		view.assign('test', 'TEST');
		view.load('node_modules/gracenode/test/view/test.html', function (error, content) {
			assert.equal(error, undefined);
			assert(content);
			console.log(content);
			done();
		});
	});

	it('Can send an HTTP GET request', function (done) {
		gn.request.GET('http://localhost:8000/test/get', { boo: 1, foo: 1 }, { gzip: true }, function (error, body, status) {
			console.log(error, body, status);
			assert.equal(error, undefined);
			assert.equal(status, 200);
			done();
		});
	});

	it('Can start a UDP server', function (done) {
		gn.udp.startServers(function (error) {
			assert.equal(error, undefined);
			done();
		});
	});
	
	it('Can send and receive a message', function (done) {
		var server = gn.udp.getServerByName('test');
		server.on('message', function (msg) {
			console.log('message received:', msg.toString());
			assert.equal(msg.toString(), 'hello');
			done();
		});
		server.on('error', function (error) {
			throw new Error(error);
		});
		gn.udp.send('test', 'hello', null, function () {});
	});

	it('Can set up session', function (done) {
		var value = {};

		gn.session.setGetter(function (id, cb) {
			cb(null, value[id]);
		});

		gn.session.setSetter(function (id, val, cb) {
			value[id] = val;
			cb();
		});

		gn.session.set('test', 100, function (error, sessionId) {
			assert.equal(error, undefined);
			gn.session.get(sessionId, function (error, v) {
				assert.equal(error, undefined);
				assert.equal(v, 100);
				done();
			});
		});
	});

	it('Can get wallet module schema SQL', function (done) {
		gn.getModuleSchema('wallet', function (error, sqlList) {
			assert.equal(error, undefined);
			assert(sqlList.length);
			done();
		});
	});

});

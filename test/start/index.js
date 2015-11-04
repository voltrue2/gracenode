var path = require('../lib/path');
var exec = require('child_process').exec;
var assert = require('assert');
var test = function (type, expected, given) {
	try {
		assert[type](expected, given);
	} catch (e) {
		console.error('expected:', expected);
		console.error('given:', given);
		throw e;
	}
};
var runApp = function (execPath, cb) {
	exec(process.execPath + ' ' + execPath, cb);
};

describe('gracenode', function () {

	var run = path + 'start/run.js';	
	var custom = path + 'start/custom.js';

	it('can successfully start without bootstrapping modules', function (done) {
		runApp(run, function (error, out, err) {
			test('equal', error, null);
			test('equal', err, '');
			done();
		});
	});

	it('can successfully start with a module', function (done) {
		runApp(run + ' withConf ../modules/withConf', function (error, out, err) {
			test('equal', error, null);
			test('equal', err, '');
			done();
		});
	});

	it('can successfully start with 2 modules', function (done) {
		runApp(run + ' withConf ../modules/withConf withSetup ../modules/withSetup', function (error, out, err) {
			test('equal', error, null);
			test('equal', err, '');
			done();
		});
	});

	it('can successfully start with staticdata module bootstrapped', function (done) {
		runApp(custom, function (error, out, err) {
			test('equal', error, null);
			test('equal', err, '');
			done();
		});
	});

	it('can bootstrap a module with a hypen in its name and convert it to camel case', function (done) {
		runApp(run + ' with-hyphen ../modules/with-hyphen', function (error, out, err) {
			test('equal', error, null);
			test('equal', err, '');
			done();
		});
	});

	it('can fail to start for missing config', function (done) {
		runApp(run + ' withConfig ../modules/withConf', function (error, out, err) {
			test('equal', error, null);
			test('notEqual', err, '');
			done();
		});
	});

	it('can fail to start', function (done) {
		runApp(run + ' foo /boo/', function (error, out, err) {
			test('equal', error, null);
			test('notEqual', err, '');
			done();
		});
	});

	it('can fail to start with 2 modules with the same name', function (done) {
		runApp(run + ' withConf ../modules/withConf withConf ../modules/withSetup', function (error, out, err) {
			test('notEqual', error, null);
			test('notEqual', err, '');
			done();
		});
	});

	it('can fail to start with 2 modules with the same path', function (done) {
		runApp(run + ' withConf ../modules/withConf withSetup ../modules/withConf', function (error, out, err) {
			test('notEqual', error, null);
			test('notEqual', err, '');
			done();
		});
	});

});

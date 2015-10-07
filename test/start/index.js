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
var run = function (execPath, cb) {
	exec(process.execPath + ' ' + execPath, cb);
};

describe('gracenode', function () {

	var start = path + 'start/run.js';	

	it('can successfully start without bootstrapping modules', function (done) {
		run(start, function (error, out, err) {
			test('equal', error, null);
			test('equal', err, '');
			done();
		});
	});

	it('can successfully start with a module', function (done) {
		run(start + ' withConf ../modules/withConf', function (error, out, err) {
			test('equal', error, null);
			test('equal', err, '');
			done();
		});
	});

	it('can successfully start with 2 modules', function (done) {
		run(start + ' withConf ../modules/withConf withSetup ../modules/withSetup', function (error, out, err) {
			test('equal', error, null);
			test('equal', err, '');
			done();
		});
	});

	it('can failed to start for missing config', function (done) {
		run(start + ' withConfig ../modules/withConf', function (error, out, err) {
			test('equal', error, null);
			test('notEqual', err, '');
			done();
		});
	});

	it('can fail to start', function (done) {
		run(start + ' foo /boo/', function (error, out, err) {
			test('equal', error, null);
			test('notEqual', err, '');
			done();
		});
	});

	it('can fail to start with 2 modules with the same name', function (done) {
		run(start + ' withConf ../modules/withConf withConf ../modules/withSetup', function (error, out, err) {
			test('notEqual', error, null);
			test('notEqual', err, '');
			done();
		});
	});

});

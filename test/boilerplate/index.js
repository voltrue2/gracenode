var exec = require('child_process').exec;
var assert = require('assert');
var request = require('../src/request');
var gn = require('../../src/gracenode');
var boilerplatePath = process.cwd() + '/boilerplate/';
var testPath = process.cwd() + '/test/boilerplate/app';

describe('gracenode boilerplate', function () {

	it('can clean up before tests', function (done) {
		exec('rm -rvf ' + testPath + '/*', done);
	});
	
	it('can create boilerplate for an application', function (done) {
		exec('cp -rv ' + boilerplatePath + '* ' + testPath, done);
	});

	it('can set up configurations', function (done) {
		exec('ln -fs ' + testPath + '/configs/my.json ' + testPath + '/configs/config.json', done);
	});

	it('can start the default HTTP server', function (done) {
		exec('make -C ' + testPath + ' start', function (error, out) {
			assert.equal(error, null);
			done();
		});
	});

	it('can check status of the default HTTP server', function (done) {
		exec('make -C ' + testPath + ' status', function (error, out) {
			assert.equal(error, null);
			done();
		});
	});

	it('the default HTTP server can handle a request GET /', function (done) {
		request.GET('http://localhost:8888/', {}, null, function (error, res, st, headers) {
			assert.equal(error, null);
			assert.equal(st, 200);
			done();
		});
	});

	it('the default HTTP server can handle a request GET /hello/{message}', function (done) {
		request.GET('http://localhost:8888/hello/foo', {}, null, function (error, res, st, headers) {
			assert.equal(error, null);
			assert.equal(st, 200);
			done();
		});
	});

	it('can stop the default HTTP server', function (done) {
		exec('make -C ' + testPath + ' stop', function (error, out) {
			assert.equal(error, null);
			done();
		});
	});

	it('can clean up after tests', function (done) {
		exec('rm -rvf ' + testPath + '/*', done);
	});

	it('can make sure .placeholder file is in app directory', function (done) {
		exec('touch ' + testPath + '/.placeholder', done);
	});

});

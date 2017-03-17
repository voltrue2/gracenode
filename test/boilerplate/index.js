var fs = require('fs');
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

	it('can make sure that default HTTP server is not running', function (done) {
		exec('make -C ' + testPath + ' stop', function () {
			// we ignore error
			done();
		});
	});
	
	it('can create boilerplate for an application', function (done) {
		exec('cp -rv ' + boilerplatePath + '* ' + testPath, function (error) {
			assert.equal(error, null);
			exec('sed -i.bak s/require\\(\'gracenode\'\\)/require\\(\'..\\/\\.\\.\\/src\\/gracenode\'\\)/ ' + boilerplatePath + 'index.js', done);
		});
	});

	it('can set up node_modules directory and symolic link to gracenode for tests', function (done) {
		exec('mkdir ' + testPath + '/node_modules', function (error) {
			
			if (error) {
				console.error(error);
			}

			assert.equal(error, null);

			exec('ln -fs ' + process.cwd() + ' ' + testPath + '/node_modules/gracenode', done);
		});
	});

	it('make sure that we have logs/ and daemonlogs dir', function (done) {
		exec('mkdir ' + testPath + '/logs', function () {
			// we ignore the error
			exec('mkdir ' + testPath + '/daemonlogs', function () {
				// we ignore the error
				done();
			});
		});
	});

	it('can set up configurations', function (done) {
		exec('ln -fs ' + testPath + '/configs/my.json ' + testPath + '/configs/config.json', done);
	});

	it('can start the default HTTP server', function (done) {
		exec('make -C ' + testPath + ' start', function (error, out) {
			
			if (error) {
				console.error(error);
			}

			assert.equal(error, null);
			done();
		});
	});

	it('can check status of the default HTTP server', function (done) {
		exec('make -C ' + testPath + ' status', function (error, out) {
			
			if (error) {
				console.error(error);
			}

			assert.equal(error, null);
			done();
		});
	});

	it('can wait for 1000ms', function (done) {
		setTimeout(done, 1000);
	});

	it('the default HTTP server can handle a request GET /', function (done) {
		request.GET('http://localhost:8888/', {}, null, function (error, res, st, headers) {
			
			if (error) {
				console.error(error);
			}

			assert.equal(error, null);
			assert.equal(st, 200);
			done();
		});
	});

	it('the default HTTP server can handle a request GET /hello/{message}', function (done) {
		request.GET('http://localhost:8888/hello/foo', {}, null, function (error, res, st, headers) {
			
			if (error) {
				console.error(error);
			}

			assert.equal(error, null);
			assert.equal(st, 200);
			done();
		});
	});

	it('can stop the default HTTP server', function (done) {
		exec('make -C ' + testPath + ' stop', function (error, out) {
			
			if (error) {
				console.error(error);
			}

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

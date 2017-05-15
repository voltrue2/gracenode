'use strict';

const request = require('../src/request');
const assert = require('assert');
const exec = require('child_process').exec;
const gn = require('../../');

const ONE = 'node ' + __dirname + '/servers/one.js';
const TWO = 'node ' + __dirname + '/servers/two.js';

describe('gracenode.portal', function () {
	
	var one2two;

	it('can clean up before the tests', function (done) {
		clean(done);
	});

	it('can start server one', function (done) {
		exec(ONE + ' start', function (err) {
			if (err) {
				console.error(err);
			}
			assert.equal(err, null);
			setImmediate(function () { done(); });
		});
	});

	it('can wait for 2 second', function (done) {
		setTimeout(done, 2000);
	});

	it('can start server two', function (done) {
		exec(TWO + ' start', function (err) {
			if (err) {
				console.error(err);
			}
			assert.equal(err, null);
			setImmediate(function () { done(); });
		});
	});

	it('can wait for 2 second', function (done) {
		setTimeout(done, 2000);
	});

	it('server one can send a mesh network message to server two and get a response from it', function (done) {
		const url = 'http://127.0.0.1:8500/one2two';
		request.GET(url, null, null, function (error, body, status) {
			if (error) {
				console.error(error);
			}
			if (status > 399) {
				console.error('Error:', status, body.toString());
			}
			assert.equal(error, null);
			body = JSON.parse(body);
			assert.equal(status, 200);
			assert.equal(body.str, 'one2two');
			one2two = body;
			done(); 
		});
	});

	it('can wait for 0.1 second', function (done) {
		setTimeout(done, 100);
	});

	it('server two can send a mesh network message to all server ones', function (done) {
		const url = 'http://127.0.0.1:8600/two2one';
		request.GET(url, null, null, function (error, body, status) {
			if (error) {
				console.error(error);
			}
			if (status > 399) {
				console.error('Error:', status, body.toString());
			}
			assert.equal(error, null);
			body = JSON.parse(body);
			assert.equal(status, 200);
			assert.equal(body.message, 'OK');
			done(); 
		});
	});

	it('can wait for 0.1 second', function (done) {
		setTimeout(done, 100);
	});

	it('server ones and server two now share the same (except for .str) data', function (done) {
		const url = 'http://127.0.0.1:8500/two2one';
		request.GET(url, null, null, function (error, body, status) {
			assert.equal(error, null);
			assert.equal(status, 200);
			body = JSON.parse(body);
			assert.equal(body.str, 'two2one');
			body.str = 'one2two';
			assert.equal(JSON.stringify(one2two), JSON.stringify(body));
			done(); 
		});
		
	});

	it('can clean up after the tests', function (done) {
		clean(done);
	});

});

function clean(cb) {
	exec(ONE + ' stop', function () {
		exec(TWO + ' stop', function () {
			cb();
		});
	});
}


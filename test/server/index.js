var request = require('../request');
var assert = require('assert');

var domain = 'http://localhost:8099';

var hookTest = function (req, done) {
	var result = req.data('result');
	if (result === 'success') {
		return done();
	} else {
		return done(new Error('failed'), 403);
	}
};

describe('gracenode server module ->', function () {
	it('Can start HTTP server', function (done) {
		
		var gn = require('../../');
		
		gn.setConfigPath('node_modules/gracenode/test/configs/');
		gn.setConfigFiles(['server.json']);

		gn.use('server');

		gn.setup(function (error) {
			assert.equal(error, undefined);
			gn.server.setupRequestHooks({
				hook: hookTest
			});
			gn.server.start();
			done();
		});
	});

	it('Can handle a GET request', function (done) {
		var args = {
			boo: 'BOO',
			foo: 'FOO'
		};
	
		request.send(domain + '/test/get/one/two/three', 'GET', args, null, function (error, body) {
			assert.equal(error, undefined);
			assert.equal(body.boo, args.boo);
			assert.equal(body.foo, args.foo);
			assert.equal(body.parameters[0], 'one');
			assert.equal(body.parameters[1], 'two');
			assert.equal(body.parameters[2], 'three');
			done();
		});
	});

	it('Can handle a POST request', function (done) {
		var args = {
			boo: 'BOO',
		};
	
		request.send(domain + '/test/post', 'POST', args, null, function (error, body) {
			assert.equal(error, undefined);
			assert.equal(body, args.boo);
			done();
		});
	});

	it('Can handle a PUT request', function (done) {
		var args = {
			boo: 'BOO',
		};
	
		request.send(domain + '/test/put', 'PUT', args, null, function (error, body) {
			assert.equal(error, undefined);
			assert.equal(body, args.boo);
			done();
		});
	});
	
	it('Can handle a DELETE request', function (done) {
		var args = {
			boo: 'BOO',
		};
	
		request.send(domain + '/test/delete', 'DELETE', args, null, function (error, body) {
			assert.equal(error, undefined);
			done();
		});
	});

	it('Can pass request hook', function (done) {
		request.send(domain + '/hook/success', 'POST', { result: 'success' }, null, function (error, body) {
			assert.equal(error, undefined);
			done();
		});
	});
	
	it('Can fail request hook', function (done) {
		request.send(domain + '/hook/failed', 'POST', { result: 'failed' }, null, function (error, body, status) {
			assert(error);
			assert(status, 403);
			assert.equal(body, 'failed');
			done();
		});
	});

	it('Can respond with 404 on none existing URI', function (done) {
		request.send(domain + '/blah', 'GET', {}, null, function (error, body, status) {
			assert(error);
			assert.equal(status, 404);
			assert.equal(body, 'controller not found:/var/www/node_modules/gracenode/test/server/controller/blah/null');
			done();
		});
	});

	it('Can reroute a request from /take/me to /land/here', function (done) {
		request.send(domain + '/take/me', 'GET', {}, null, function (error, body) {
			assert.equal(error, undefined);
			assert.equal(body, 'land/here');
			done();
		});
	});
	
	it('Can reroute a request from / to /land/here', function (done) {
		request.send(domain, 'GET', {}, null, function (error, body) {
			assert.equal(error, undefined);
			assert.equal(body, 'land/here');
			done();
		});
	});

	it('Can reject wrong request method', function (done) {
		request.send(domain + '/test/get', 'POST', {}, null, function (error, body, status) {
			assert(error);
			assert.equal(status, 400);
			assert.equal(body, '/test/get does not accept "POST"');
			done();
		});
	});

	it('Can execute pre-assigned error controller on error status 500', function (done) {
		request.send(domain + '/test/errorOut', 'GET', {}, null, function (error, body) {
			assert(error);
			assert.equal(body, 'internal error');
			done();
		});		
	});

});

var request = require('../request');
var assert = require('assert');

var http = 'http://localhost';
var https = 'https://localhost';

var hookTest = function (req, done) {
	var result = req.data('result');
	if (result === 'success') {
		return done();
	} else {
		return done(new Error('failed'), 403);
	}
};

describe('gracenode server module ->', function () {
	
	it('Can start HTTPS server', function (done) {
		
		var gn = require('../../');
		
		gn.setConfigPath('node_modules/gracenode/test/configs/');
		gn.setConfigFiles(['https.json']);

		gn.use('server');

		gn.setup(function (error) {
			assert.equal(error, undefined);
			gn.server.setupRequestHooks({
				hook: hookTest
			});
			https += ':' + gn.config.getOne('modules.server.port');
			gn.server.start();
			done();
		});
	});

	it('Can start HTTP server', function (done) {
		
		var gn = require('../../');
		
		gn.setConfigPath('node_modules/gracenode/test/configs/');
		gn.setConfigFiles(['http.json']);

		gn.use('server');

		gn.setup(function (error) {
			assert.equal(error, undefined);
			http += ':' + gn.config.getOne('modules.server.port');
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
	
		request.send(http + '/test/get/one/two/three', 'GET', args, null, function (error, body) {
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
	
		request.send(http + '/test/post', 'POST', args, null, function (error, body) {
			assert.equal(error, undefined);
			assert.equal(body, args.boo);
			done();
		});
	});

	it('Can handle a PUT request', function (done) {
		var args = {
			boo: 'BOO',
		};
	
		request.send(http + '/test/put', 'PUT', args, null, function (error, body) {
			assert.equal(error, undefined);
			assert.equal(body, args.boo);
			done();
		});
	});
	
	it('Can handle a DELETE request', function (done) {
		var args = {
			boo: 'BOO',
		};
	
		request.send(http + '/test/delete', 'DELETE', args, null, function (error, body) {
			assert.equal(error, undefined);
			done();
		});
	});

	it('Can pass request hook', function (done) {
		request.send(http + '/hook/success', 'POST', { result: 'success' }, null, function (error, body) {
			assert.equal(error, undefined);
			done();
		});
	});
	
	it('Can fail request hook', function (done) {
		request.send(http + '/hook/failed', 'POST', { result: 'failed' }, null, function (error, body, status) {
			assert(error);
			assert(status, 403);
			assert.equal(body, 'failed');
			done();
		});
	});

	it('Can respond with 404 on none existing URI', function (done) {
		request.send(http + '/blah', 'GET', {}, null, function (error, body, status) {
			assert(error);
			assert.equal(status, 404);
			assert.equal(body, 'controller not found:/var/www/node_modules/gracenode/test/server/controller/blah/null');
			done();
		});
	});

	it('Can reroute a request from /take/me to /land/here', function (done) {
		request.send(http + '/take/me', 'GET', {}, null, function (error, body) {
			assert.equal(error, undefined);
			assert.equal(body, 'land/here');
			done();
		});
	});
	
	it('Can reroute a request from / to /land/here', function (done) {
		request.send(http, 'GET', {}, null, function (error, body) {
			assert.equal(error, undefined);
			assert.equal(body, 'land/here');
			done();
		});
	});

	it('Can reject wrong request method', function (done) {
		request.send(http + '/test/get', 'POST', {}, null, function (error, body, status) {
			assert(error);
			assert.equal(status, 400);
			assert.equal(body, '/test/get does not accept "POST"');
			done();
		});
	});

	it('Can execute pre-assigned error controller on error status 500', function (done) {
		request.send(http + '/test/errorOut', 'GET', {}, null, function (error, body) {
			assert(error);
			assert.equal(body, 'internal error');
			done();
		});		
	});

});

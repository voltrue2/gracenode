var assert = require('assert');
var gn = require('../../');

var http = 'http://localhost';
var https = 'https://localhost';

var options = {
	gzip: true
};

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
		
		gn.setConfigPath('gracenode/test/configs/');
		gn.setConfigFiles(['https.json']);

		gn.use('request');
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
		
		gn.setConfigPath('gracenode/test/configs/');
		gn.setConfigFiles(['http.json']);
		
		gn.use('request');
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
	
		gn.request.GET(http + '/test/get/one/two/three', args, options, function (error, body, status) {
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body.boo, args.boo);
			assert.equal(body.foo, args.foo);
			assert.equal(body.parameters[0], 'one');
			assert.equal(body.parameters[1], 'two');
			assert.equal(body.parameters[2], 'three');
			done();
		});
	});

	it('Can ignore a request', function (done) {
		gn.request.GET(http + '/ignore/me', {}, options, function (error, body, status) {
			assert.equal(status, 404);
			done();
		});
	});

	it('Can handle a POST request', function (done) {
		var args = {
			boo: 'BOO',
		};
	
		gn.request.POST(http + '/test/post', args, options, function (error, body) {
			assert.equal(error, undefined);
			assert.equal(body, args.boo);
			done();
		});
	});

	it('Can handle a PUT request', function (done) {
		var args = {
			boo: 'BOO',
		};
	
		gn.request.PUT(http + '/test/put', args, options, function (error, body) {
			assert.equal(error, undefined);
			assert.equal(body, args.boo);
			done();
		});
	});
	
	it('Can handle a DELETE request', function (done) {
		var args = {
			boo: 'BOO',
		};
	
		gn.request.DELETE(http + '/test/delete', args, options, function (error, body) {
			assert.equal(error, undefined);
			done();
		});
	});

	it('Can pass request hook', function (done) {
		gn.request.POST(http + '/hook/success', { result: 'success' }, options, function (error, body) {
			assert.equal(error, undefined);
			done();
		});
	});
	
	it('Can fail request hook', function (done) {
		gn.request.POST(http + '/hook/failed', { result: 'failed' }, options, function (error, body, status) {
			assert(error);
			assert(status, 403);
			assert.equal(body, 'failed');
			done();
		});
	});

	it('Can respond with 404 on none existing URI', function (done) {
		gn.request.GET(http + '/blah', {}, options, function (error, body, status) {
			assert(error);
			assert.equal(status, 404);
			done();
		});
	});

	it('Can reroute a request from /take/me to /land/here', function (done) {
		gn.request.GET(http + '/take/me', {}, options, function (error, body) {
			assert.equal(error, undefined);
			assert.equal(body, 'land/here');
			done();
		});
	});
	
	it('Can reroute a request from / to /land/here', function (done) {
		gn.request.GET(http, {}, options, function (error, body) {
			assert.equal(error, undefined);
			assert.equal(body, 'land/here');
			done();
		});
	});

	it('Can reject wrong request method', function (done) {
		gn.request.POST(http + '/test/get', {}, options, function (error, body, status) {
			assert(error);
			assert.equal(status, 400);
			assert.equal(body, '/test/get does not accept "POST"');
			done();
		});
	});

	it('Can execute pre-assigned error controller on error status 500', function (done) {
		gn.request.GET(http + '/test/errorOut', {}, options, function (error, body, status) {
			assert(error);
			assert.equal(status, 500);
			assert.equal(body, 'internal error');
			done();
		});		
	});

	it('Can auto look-up index.js for a request /test/', function (done) {
		gn.request.GET(http + '/test', {}, options, function (error, body, status) {
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body, 'index');
			done();
		});
	});

});

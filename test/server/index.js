var assert = require('assert');
var gn = require('../../src/gracenode');
/*
var request = require('./request');
var options = {
	gzip: true
};
*/
var hookTest1 = function (req, done) {
	var result = req.data('result');
	if (result === 'success') {
		return done();
	} else {
		return done(new Error('failed'), 403);
	}
};

var hookTest2 = function (req, done) {
	var result = req.data('result');
	if (result === 'success') {
		return done();
	} else {
		return done(new Error('failed'), 403);
	}
};

var success = function (req, done) {
	assert(req);
	done();
};

var failure = function (req, done) {
	assert(req);
	done(new Error('failed'), 400);
};

describe('gracenode server', function () {

	var root = gn.getRootPath() + '../../../';

	it('can start HTTP server', function (done) {
		gn.config({
			cluster: {
				max: 0
			},
			server: {
				protocol: 'http',
				host: 'localhost',
				port: 8099,
				urlPrefix: '/dummy/',
				controllerPath: root + 'test/server/controller/',
				reroute: [
					{ from: '/test/me/', to: '/land/here' },
					{ from: '/', to: '/land/here' }
				],
				error: {
					'500': {
						controller: 'error',
						method: 'internal'
					}
				},
				ignored: [
					'/ignore/me'
				]
			}
		});
		gn.use('server', '../../gracenode-server');
		gn.start(function () {
			var logger = gn.log.create('all request hook');
			var logger2 = gn.log.create('all response hook');
			var logger3 = gn.log.create('msc');
			gn.mod.server.addRequestHooks(function reqAllHook(req, cb) {
				logger.debug('all request hook called');
				cb();
			});
			gn.mod.server.addRequestHooks({
				hook: [
					hookTest1,
					hookTest2,
					function hookTest(req, cb) {
						assert.equal(req.controller, 'hook');
						cb();
					}
				],
				hook2: {
					failed: hookTest2
				},
				test: {
					get: function hookTestForGet(req, cb) {
						assert.equal(req.controller, 'test');
						assert.equal(req.method, 'get');
						cb();
					},
					sub: {
						sub2: {
							index: function subSub2IndexHook(req, cb) {
								req.set('key', 'sub2/index');
								cb();
							},
							foo: function subSub2FooHook(req, cb) {
								req.set('key', 'sub2/foo');
								cb();
							}
						},
						index: function subIndexHook(req, cb) {
							req.set('key', 'index');
							cb();
						}
					}
				}
			});
			gn.mod.server.addResponseHooks(function (req, cb) {
				logger2.debug('all response hook called:', req.url);
				cb();
			});
			gn.mod.server.addResponseHooks({
				hook: [
					success,
					success,
					success
				],
				hook3: {
					index: failure
				},
				test: {
					sub: {
						index: function testSubIndexHook(req, cb) {
							logger.debug('response hook on subdirectoried method test/sub/index', req.controller, req.method);
							cb();
						},
						sub2: {
							foo: function testSubSub2FooHook(req, cb) {
								logger.debug('response hook for test/sub/sub2/foo');
								cb();
							}
						}
					}
				}
			});
			var map = gn.mod.server.getControllerMap();
			logger3.debug(map);
			gn.mod.server.start();
			done();
		});
	});

});

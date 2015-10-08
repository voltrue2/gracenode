var port = 8099;
var assert = require('assert');
var request = require('./request');
var gn = require('../../src/gracenode');
var http = 'http://localhost:' + port; 
var options = {
	gzip: true
};
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
	
	var allRequestHookCalled = false;
	var root = gn.getRootPath() + '../../../';

	it('can start HTTP server', function (done) {
		gn.config({
			log: {
				console: false,
				color: false,
				level: '>= verbose'
			},
			cluster: {
				max: 0
			},
			server: {
				protocol: 'http',
				host: 'localhost',
				port: port,
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
			gn.mod.server.addRequestHooks(function reqAllHook(req, cb) {
				allRequestHookCalled = true;
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
							assert.equal('test', req.controller);
							assert.equal('sub/index', req.method);
							cb();
						},
						sub2: {
							foo: function testSubSub2FooHook(req, cb) {
								assert.equal('test', req.controller);
								assert.equal('sub/sub2', req.method);
								cb();
							}
						}
					}
				}
			});
			gn.mod.server.start();
			done();
		});
	});

	it('can get a map of all controllers', function () {
		var map = gn.mod.server.getControllerMap();
		var expectedMap = {
			content: {
				data: true,
				download: true,
				html: true,
				json: true
			},
			error: {
				internal: true,
				notFound: true,
				unauthorized: true
			},
			expected: { index: true },
			file: { upload: true },
			hook: { failed: true, success: true },
			hook2: { failed: true },
			hook3: { index: true },
			land: { here: true },
			patch: { index: true },
			redirect: { dest: true, perm: true, tmp: true },
			test: {
				cache: true,
				delete: true,
				double: true,
				errorOut: true,
				get: true,
				get2: true,
				get3: true,
				head: true,
				index: true,
				params: true,
				post: true,
				post2: true,
				put: true,
				sub: {
					call: true,
					index: true,
					sub2: { foo: true, index: true }
				}
			}
		};
		for (var one in expectedMap) {
			assert(map[one]);
			for (var two in expectedMap[one]) {
				assert(map[one][two]);
				for (var three in expectedMap[one][two]) {
					assert(map[one][two][three]);
					for (var four in expectedMap[one][two][three]) {
						assert(map[one][two][three][four]);
					}
				}
			}
		}
	});

	it('can handle a GET request /test/get2/one/two/three', function (done) {
		var args = {
			boo: 'BOO',
			foo: 'FOO'
		};
		request.GET(http + '/test/get2/one/two/three', args, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
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

});

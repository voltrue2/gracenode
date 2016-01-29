var logEnabled = process.argv[process.argv.length - 1].replace('--log=', '') === 'true' ? true : false;
var port = 8099;
var dummy = '/dummy';
var assert = require('assert');
var request = require('./request');
var gn = require('../../src/gracenode');
var http = 'http://localhost:' + port + dummy; 
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

describe('gracenode with  gracenode-server/', function () {
	
	var allRequestHookCalled = false;
	var root = gn.getRootPath() + '../../../';

	it('creates a symbolic link for test', function (done) {
		var exec = require('child_process').exec;
		exec('ln -sf ../src/gracenode ../../gracenode', done);
	});

	it('can start HTTP server', function (done) {
		gn.config({
			log: {
				console: logEnabled,
				color: true,
				level: '>= verbose'
			},
			cluster: {
				max: 0
			},
			server: {
				protocol: 'http',
				host: 'localhost',
				port: port,
				urlPrefix: 'dummy',
				trailingSlash: true,
				controllerPath: root + 'test/server/controller/',
				reroute: [
					{ from: '/take/me', to: '/land/here' },
					{ from: '/', to: '/land/here' }
				],
				error: {
					'500': {
						controller: 'error',
						method: 'internal'
					},
					'404': {
						controller: 'error',
						method: 'notFound'
					},
					'403': {
						controller: 'error',
						method: 'unauthorized'
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
								assert.equal('sub/sub2/foo', req.method);
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

	it('can get a map of all controllers/', function () {
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

	it('can handle a GET request /test/get2/one/two/three/', function (done) {
		var args = {
			boo: 'BOO',
			foo: 'FOO'
		};
		request.GET(http + '/test/get2/one/two/three/', args, options, function (error, body, status) {
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

	it('can read sent data correctly with the correct data type', function (done) {
		var args = {
			boo: JSON.stringify([1])
		};
		request.GET(http + '/test/get2/', args, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body.boo[0], 1);
			done();
		});
	});

	it('can read the sent data literally', function (done) {
		var list = JSON.stringify({a: 10, b: 'BB', c: '100'});
		request.POST(http + '/test/post2/', { list: list }, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body, list);
			done();
		});
	});

	it('can handle a HEAD request (controller expects HEAD)', function (done) {
		var args = {
			boo: 'BOO',
			foo: 'FOO'
		};
		request.HEAD(http + '/test/head/', args, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(status, 200);
			done();
		});
	});	

	it('can ignore a request', function (done) {
		request.GET(http + '/ignore/me/', {}, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			assert.equal(status, 404);
			done();
		});
	});

	it('can handle a POST request', function (done) {
		var args = {
			boo: 'BOO',
		};
		request.POST(http + '/test/post/', args, options, function (error, body) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(body, args.boo);
			done();
		});
	});

	it('can handle a PUT request', function (done) {
		var args = {
			boo: 'BOO',
		};
		request.PUT(http + '/test/put/', args, options, function (error, body) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(body, args.boo);
			done();
		});
	});

	it('can handle a DELETE request', function (done) {
		var args = {
			boo: 'BOO',
		};
	
		request.DELETE(http + '/test/delete/', args, options, function (error) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			done();
		});
	});

	it('can respond with 404 on none existing URI', function (done) {
		request.GET(http + '/blah/', {}, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert(error);
			assert.equal(status, 404);
			done();
		});
	});

	it('can reroute a request from /take/me/ to /land/here/', function (done) {
		request.GET(http + '/take/me/', {}, options, function (error, body) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(body, 'land/here');
			done();
		});
	});

	it('can reroute a request from /take/me/ to /land/here/ and carry the original request data', function (done) {
		request.GET(http + '/take/me/?id=1', {}, options, function (error, body) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(body, 'land/here1');
			done();
		});
	});

	it('can reroute a request from /take/me/ to /land/here/ and carry the original parameters', function (done) {
		request.GET(http + '/take/me/100/', {}, options, function (error, body) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(body, 'land/here100');
			done();
		});
	});
	
	it('can reroute a request from / to /land/here/', function (done) {
		request.GET(http, {}, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(body, 'land/here');
			assert.equal(status, 200);
			done();
		});
	});

	it('can reject wrong request method', function (done) {
		request.POST(http + '/test/get2/', {}, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, false);
			assert(error);
			assert.equal(status, 405);
			assert.equal(body, '/dummy/test/get2/ does not accept "POST"');
			done();
		});
	});

	it('can execute pre-defined error controller on error status 500', function (done) {
		request.GET(http + '/test/errorOut/', {}, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert(error);
			assert.equal(status, 500);
			assert.equal(body, 'internal error');
			done();
		});		
	});

	it('can execute pre-assigned error controller on error status 404', function (done) {
		request.GET(http + '/iAmNotHere/', {}, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert(error);
			assert.equal(status, 404);
			assert.equal(body, 'not found');
			done();
		});		
	});

	it('can auto look-up index.js for a request /test/', function (done) {
		request.GET(http + '/test/', {}, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body, 'index');
			done();
		});
	});

	it('can pass request hook', function (done) {
		request.POST(http + '/hook/success/', { result: 'success' }, options, function (error) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			done();
		});
	});

	it('can fail request hook and execute pre-defined error controller', function (done) {
		request.POST(http + '/hook2/failed/', { result: 'failed' }, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert(error);
			assert.equal(status, 403);
			assert.equal(body, 'pre-defined fail');
			done();
		});
	});
	
	it('can catch double responses', function (done) {
		request.GET(http + '/test/double/', {}, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(body.state, 'ok');
			assert.equal(status, 200);
			done();
		});
	});

	it('can handle a HEAD request', function (done) {
		var args = {
			boo: 'BOO',
			foo: 'FOO'
		};
		request.HEAD(http + '/test/get2/one/two/three/', args, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body, '');
			done();
		});
		
	});

	it('can not call response.error() more than once', function (done) {
		request.GET(http + '/test/get3/', null, options, function (error) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert(error);
			done();
		});
	});

	it('can read pre-defined paramters by names', function (done) {
		request.GET(http + '/test/params/foo/boo/', null, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body.one, 'foo');
			assert.equal(body.two, 'boo');
			done();
		});
	});

	it('can handle sub directories from the request /test/sub', function (done) {
		request.GET(http + '/test/sub/', null, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body.method, 'index');
			done();
		});
	});

	it('can handle sub directories from the request /test/sub/call', function (done) {
		request.GET(http + '/test/sub/call/', null, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body.method, 'call');
			done();
		});
	});

	it('can handle sub directories from the request /test/sub/sub2', function (done) {
		request.GET(http + '/test/sub/sub2/', null, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body.method, 'sub2/index');
			done();
		});
	});

	it('can handle sub directories from the request /test/sub/sub2/foo', function (done) {
		request.GET(http + '/test/sub/sub2/foo/', null, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body.method, 'sub2/foo');
			done();
		});
	});

	it('can handle sub directories from the request /test/sub/index/one/two with parameters', function (done) {
		request.GET(http + '/test/sub/index/one/two/', null, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body.method, 'index');
			assert.equal(body.params[0], 'one');
			assert.equal(body.params[1], 'two');
			assert.equal(body.key, 'index');
			done();
		});
	});

	it('can handle sub directories from the request /test/sub/call/one/two with parameters', function (done) {
		request.GET(http + '/test/sub/call/one/two/', null, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body.method, 'call');
			assert.equal(body.params[0], 'one');
			assert.equal(body.params[1], 'two');
			done();
		});
	});

	it('can handle sub directories from the request /test/sub/sub2/index/one/two with parameters', function (done) {
		request.GET(http + '/test/sub/sub2/index/one/two/', null, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body.method, 'sub2/index');
			assert.equal(body.params[0], 'one');
			assert.equal(body.params[1], 'two');
			assert.equal(body.key, 'sub2/index');
			done();
		});
	});

	it('can handle sub directories from the request /test/sub/sub2/foo/one/two with parameters', function (done) {
		request.GET(http + '/test/sub/sub2/foo/one/two/', null, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body.method, 'sub2/foo');
			assert.equal(body.params[0], 'one');
			assert.equal(body.params[1], 'two');
			assert.equal(body.key, 'sub2/foo');
			done();
		});
	});

	it('can redirect with status', function (done) {
		request.GET(http + '/redirect/perm/', null, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body, 'here');
			done();
		});
	});

	it('can redirect with status', function (done) {
		request.GET(http + '/redirect/tmp/', null, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body, 'here');
			done();
		});
	});

	it('can move and read data from a file', function (done) {
		request.PUT(http + '/file/upload/', null, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body.data, 'Hello World');
			done();
		});
	});

	it('can validate expected request data', function (done) {
		request.GET(http + '/expected/', { id: 100, name: 'foo' }, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(status, 200);
			done();
		});
	});

	it('can respond with an error because of missing expected data', function (done) {
		request.GET(http + '/expected/', { id: 100 }, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, false);
			assert(error);
			assert.equal(body, 'name must be a string');
			assert.equal(status, 400);
			done();
		});
	});

	it('can overwrite/remove default response headers', function (done) {
		request.GET(http + '/test/cache/', null, options, function (error, body, status, headers) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(headers['cache-control'], 'private, max-age=6000');
			done();
		});
	});

	it('can send JSON response with correct response headers', function (done) {
		request.GET(http + '/content/json/', null, options, function (error, body, status, headers) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(body.test, true);
			assert.equal(headers['content-type'], 'application/json; charset=UTF-8');
			assert.equal(headers['content-encoding'], 'gzip');
			assert.equal(headers.connection, 'Keep-Alive');
			assert(headers['content-length']);
			assert.equal(status, 200);
			done();
		});
	});

	it('can send HTML response with correct response headers', function (done) {
		request.GET(http + '/content/html', null, options, function (error, body, status, headers) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(body, '<h1>Hello</h1>');
			assert.equal(headers['content-type'], 'text/html; charset=UTF-8');
			assert.equal(headers['content-encoding'], 'gzip');
			assert.equal(headers.connection, 'Keep-Alive');
			assert(headers['content-length']);
			assert.equal(status, 200);
			done();
		});
	});

	it('can send data response with correct response headers', function (done) {
		request.GET(http + '/content/data', null, options, function (error, body, status, headers) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(body, 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAG1BMVEX////CQzfCQzfCQzfCQzfCQzfCQzfCQzfCQze4cTvvAAAACHRSTlMAM0Rmd4iqzHMjLxwAAAAuSURBVAhbY2DABhiVoIyMjgIwzdzC0gxmsDYwtOJgRHR0dASAGEC6o4FYBhoAAMUeFRBHLNC5AAAAAElFTkSuQmCC');
			assert.equal(headers['content-type'], 'image/png');
			assert.equal(headers['content-encoding'], 'gzip');
			assert.equal(headers.connection, 'Keep-Alive');
			assert(headers['content-length']);
			assert.equal(status, 200);
			done();
		});
	});

	it('can send download response with correct response headers', function (done) {
		request.GET(http + '/content/download', null, options, function (error, body, status, headers) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(body, 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAG1BMVEX////CQzfCQzfCQzfCQzfCQzfCQzfCQzfCQze4cTvvAAAACHRSTlMAM0Rmd4iqzHMjLxwAAAAuSURBVAhbY2DABhiVoIyMjgIwzdzC0gxmsDYwtOJgRHR0dASAGEC6o4FYBhoAAMUeFRBHLNC5AAAAAElFTkSuQmCC');
			assert.equal(headers['content-type'], 'image/png');
			assert.equal(headers['content-encoding'], 'gzip');
			assert.equal(headers['content-disposition'], 'attachment; filename=dummy.png');
			assert.equal(headers.connection, 'Keep-Alive');
			assert(headers['content-length']);
			assert.equal(status, 200);
			done();
		});
	});

	it('can read a GET query string with a trailing slash and auto-remove the trailing slash', function (done) {
		request.GET(http + '/test/get2?boo=BOO&foo=FOO/', null, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body.boo, 'BOO');
			assert.equal(body.foo, 'FOO');
			done();
		});
	});

	it('can force trailing slash', function (done) {
		request.GET(http + '/redirect/dest', null, options, function (error, body, status, headers) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(headers.url, '/dummy/redirect/dest/');
			done();
		});
	});

	it('can force trailing slash with GET a query', function (done) {
		request.GET(http + '/redirect/dest/?example=true', null, options, function (error, body, status, headers) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(headers.url, '/dummy/redirect/dest/?example=true');
			done();
		});
	});

	it('can force trailing slash with GET queries', function (done) {
		request.GET(http + '/redirect/dest/?example=true&test=1', null, options, function (error, body, status, headers) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(headers.url, '/dummy/redirect/dest/?example=true&test=1');
			done();
		});
	});

	it('does not force trailing slash with a GET query and trailing slash', function (done) {
		request.GET(http + '/redirect/dest/?example=true', null, options, function (error, body, status, headers) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(headers.url, '/dummy/redirect/dest/?example=true');
			done();
		});
	});

	it('does not force trailing slash with GET queries and trailing slash', function (done) {
		request.GET(http + '/redirect/dest/?example=true&test=1', null, options, function (error, body, status, headers) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(headers.url, '/dummy/redirect/dest/?example=true&test=1');
			done();
		});
	});

	it('can get a list of all end points (mapped controllers and their methods)', function () {
		var list = gn.mod.server.getEndPointList();
		var expectedList = [
			'/content/data/',
			'/content/download/',
			'/content/html/',
			'/content/json/',
			'/error/internal/',
			'/error/notFound/',
			'/error/unauthorized/',
			'/file/upload/',
			'/expected/index/',
			'/hook2/failed/',
			'/hook3/index/',
			'/hook/failed/',
			'/hook/success/',
			'/land/here/',
			'/redirect/perm/',
			'/redirect/tmp/',
			'/redirect/dest/',
			'/test/cache/',
			'/test/delete/',
			'/test/errorOut/',
			'/test/double/',
			'/test/get/',
			'/test/get2/',
			'/test/get3/',
			'/test/head/',
			'/test/index/',
			'/test/post/',
			'/test/params/',
			'/test/post2/',
			'/test/put/',
			'/test/sub/call/',
			'/test/sub/index/',
			'/test/sub/sub2/foo/',
			'/test/sub/sub2/index/'
		];
		for (var i = 0, len = expectedList.length; i < len; i++) {
			if (list.indexOf(expectedList[i]) === -1) {
				throw new Error('endpoint list does not match the expected: ' + expectedList[i]);		
			}
		}
	});

	it('can apply URL prefix and route the request correctly', function (done) {
		request.GET(http + '/test/params/one/two/', null, options, function (error, body, status) {
			assert.equal(error, undefined);
			assert.equal(body.one, 'one');
			assert.equal(body.two, 'two');
			assert.equal(status, 200);
			done();
		});
	});

	it('can get 400 response when sending a request with an incorrect method', function (done) {
		request.PUT(http + '/test/params/one/two/', null, options, function (error, body, status) {
			assert(error);
			assert(body);
			assert.equal(status, 405);
			done();
		});
	});

	it('can auto decode encoded URI paramteres', function (done) {
		var one = '日本語　英語';
		var two = '<html> test\test"test"';
		request.GET(http + '/test/params/' + encodeURIComponent(one) + '/' + encodeURIComponent(two) + '/', null, options, function (error, body, status) {
			assert.equal(error, undefined);
			assert.equal(body.one, one);
			assert.equal(body.two, two);
			assert.equal(status, 200);
			done();
		});
	});

	it('can handle a PATCH request', function (done) {
		var data = 'pathDATA';
		request.PATCH(http + '/patch/index/', { data: data }, options, function (error, body, status) {
			assert.equal(error, undefined);
			assert.equal(body.data, data);
			assert.equal(status, 200);
			done();
		});	
	});

});

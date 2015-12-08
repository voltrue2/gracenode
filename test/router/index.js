var logEnabled = require('../arg')('--log');
var port = 98052;
var dummy = '';
var pre = '../server/controller';
var assert = require('assert');
var request = require('../src/request');
var gn = require('../../src/gracenode');
var http = 'http://localhost:' + port + dummy; 
var options = {
	gzip: true
};
var hookTest1 = function (req, res, done) {
	var result = req.data ? req.data('result') : (req.body.result || req.query.result);
	if (result === 'success') {
		return (typeof done === 'function') ? done() : res();
	} else {
		return (typeof done === 'function') ? res.error(new Error('failed'), 403) : res(new Error('failed'), 403);
	}
};

var hookTest2 = function (req, res, done) {
	var result = req.data ? req.data('result') : (req.body.result || req.query.result);
	if (result === 'success') {
		return (typeof done === 'function') ? done() : res();
	} else {
		return (typeof done === 'function') ? res.error(new Error('failed'), 403) : res(new Error('failed'), 403);
	}
};

var success = function (req, res, done) {
	assert(req);
	if (typeof done === 'function') {
		done();
	} else {
		res();
	}
};

var failure = function (req, res, done) {
	assert(req);
	if (typeof done === 'function') {
		res.error(new Error('failed'), 400);
	} else {
		res(new Error('failed'), 400);
	}
};

describe('gracenode.router', function () {
	
	var allRequestHookCalled = false;

	it('can start HTTP server router', function (done) {
		gn.config({
			log: {
				console: logEnabled,
				color: true,
				level: '>= verbose'
			},
			router: {
				host: 'localhost',
				port: port
			}
		});
		gn.router.forceTrailingSlash();
		gn.start(function () {
			gn.router.hook('/', function reqAllHook(req, res, next) {
				allRequestHookCalled = true;
				next();
			});
			gn.router.hook('/hook', [
				hookTest1,
				hookTest2,
				function hookTest(req, res, cb) {
					assert.equal(req.url.indexOf('/hook'), 0);
					cb();
				}
			]);
			gn.router.hook('/hook2/failed', hookTest2);
			gn.router.hook('/test/get', function hookTestForGet(req, res, next) {
				assert.equal(req.path, '/test/get');
				next();
			});
			gn.router.hook('/test/sub', function subIndexHook(req, res, next) {
				req.args.key = 'index';
				next();
			});
			gn.router.hook('/test/sub/sub2', function subSub2IndexHook(req, res, next) {
				req.args.key = 'sub2/index';
				next();
			});
			gn.router.hook('/test/sub/sub2/foo', function (req, res, next) {
				req.args.key = 'sub2/foo';
				next();
			});
			gn.router.hook('/', function (req, res, next) {
				next();
			});
			gn.router.hook('/hook', [
				success,
				success,
				success
			]);
			gn.router.hook('/hok3/index', failure);
			gn.router.hook('/test/sub', function testSubIndexHook(req, res, next) {
				assert.equal(req.args.key, 'index');
				next();
			});
			gn.router.hook('/test/sub/sub2/foo', function testSubSub2FooHook(req, res, next) {
				assert.equal(req.path, '/test/sub/sub2/foo');
				next();
			});
			done();
		});
	});

	it('can register all endpoints', function () {
		gn.router.get('/', function (req, res) {
			res.json({ message: '/' });
		});
		gn.router.get('/ignore/me', function (req, res) {
			res.error({}, 404);
		});
		gn.router.get('/content/data', require(pre + '/content/data').GET);
		gn.router.get('/content/download', require(pre + '/content/download').GET);
		gn.router.get('/content/html', require(pre + '/content/html').GET);
		gn.router.get('/content/json', require(pre + '/content/json').GET);
		gn.router.get('/error/internal', require(pre + '/error/internal').GET);
		gn.router.get('/error/notFound', require(pre + '/error/notFound').GET);
		gn.router.post('/error/unauthorized', require(pre + '/error/unauthorized').POST);
		gn.router.get('/expected', require(pre + '/expected/index').GET, { readBody: true });
		gn.router.put('/file/upload', require(pre + '/file/upload').PUT);
		gn.router.post('/hook/failed', require(pre + '/hook/failed').POST);
		gn.router.post('/hook/success', require(pre + '/hook/success').POST);
		gn.router.post('/hook/success', require(pre + '/hook/success').POST);
		gn.router.post('/hook2/failed', require(pre + '/hook2/failed').POST);
		gn.router.post('/hook2/failed', require(pre + '/hook2/failed').POST);
		gn.router.get('/hook3', require(pre + '/hook3/index').GET);
		gn.router.get('/land/here', require(pre + '/land/here').GET);
		gn.router.patch('/patch', require(pre + '/patch/index').PATCH);
		gn.router.get('/redirect/dest', require(pre + '/redirect/dest').GET);
		gn.router.get('/redirect/perm', require(pre + '/redirect/perm').GET);
		gn.router.get('/redirect/tmp', require(pre + '/redirect/tmp').GET);
		gn.router.get('/test/cache', require(pre + '/test/cache').GET);
		gn.router.delete('/test/delete', require(pre + '/test/delete').DELETE);
		gn.router.get('/test/double', require(pre + '/test/double').GET);
		gn.router.get('/test/errorOut', require(pre + '/test/errorOut').GET);
		gn.router.get('/test/get', require(pre + '/test/get').GET);
		gn.router.get('/test/get2', require(pre + '/test/get2').GET, { readBody: true });
		gn.router.get('/test/get2/{one}/{two}/{three}', require(pre + '/test/get2').GET, { readBody: true });
		gn.router.get('/test/get3', require(pre + '/test/get3').GET);
		gn.router.head('/test/head', require(pre + '/test/head').HEAD);
		gn.router.get('/test', require(pre + '/test/index').GET);
		gn.router.get('/test/params/{one}/{two}', require(pre + '/test/params').GET);
		gn.router.post('/test/post', require(pre + '/test/post').POST);
		gn.router.post('/test/post2', require(pre + '/test/post2').POST);
		gn.router.put('/test/put', require(pre + '/test/put').PUT);
		gn.router.get('/test/sub/call/{one}/{two}', require(pre + '/test/sub/call').GET);
		gn.router.get('/test/sub/{one}/{two}', require(pre + '/test/sub/index').GET);
		gn.router.get('/test/sub/sub2/foo/{one}/{two}', require(pre + '/test/sub/sub2/foo').GET);
		gn.router.get('/test/sub/sub2/{one}/{two}', require(pre + '/test/sub/sub2/index').GET);
		gn.router.get('/car', function (req, res) {
			res.text('/car');
		});
		gn.router.get('/car/{type}/detail/{info}', function (req, res) {
			res.text('/car/' + req.params.type + '/detail/' + req.params.info);
		});
		gn.router.get('/num/{number:int}/{number:float}', function (req, res) {
			res.json({ int: req.params.int, float: req.params.float });
		});
	});

	it('can register error handlers', function () {
		gn.router.error(500, require(pre + '/error/internal').GET);
		gn.router.error(404, require(pre + '/error/notFound').GET);
		gn.router.error(403, require(pre + '/error/unauthorized').POST);
	});

	it('can add more hooks', function () {
		gn.router.hook('/test', function testRouteHook(req, res, next) {
			req.args.testRoute = true;
			next();
		});
	});

	it('can handle a GET request /car', function (done) {
		request.GET(http + '/car', {}, options, function (error, body, status) {
			assert.equal(error, undefined);
			assert.equal(body, '/car');
			assert.equal(status, 200);
			done();
		});
	});

	it('can handle a GET request /car/{type}/detail/{info}', function (done) {
		request.GET(http + '/car/suv/detail/black', {}, options, function (error, body, status) {
			assert.equal(error, undefined);
			assert.equal(body, '/car/suv/detail/black');
			assert.equal(status, 200);
			done();
		});
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
		request.GET(http + '/test/get2/1/2/3', args, options, function (error, body, status) {
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
			assert.equal(allRequestHookCalled, false);
			assert(error);
			assert.equal(status, 404);
			done();
		});
	});

	/*
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
	*/

	it('can reject wrong request method', function (done) {
		request.POST(http + '/test/get2/', {}, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, false);
			assert(error);
			assert.equal(status, 404);
			assert.equal(body, dummy + 'not found');
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
			assert.equal(allRequestHookCalled, false);
			assert(error);
			assert.equal(status, 404);
			assert.equal(body, 'not found');
			done();
		});		
	});

	/*
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
	*/

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
		request.GET(http + '/test/sub/1/2/', null, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body.method, 'index');
			done();
		});
	});

	it('can handle sub directories from the request /test/sub/call/var1/var2', function (done) {
		request.GET(http + '/test/sub/call/var1/var2', null, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(status, 200);
			done();
		});
	});

	it('can handle sub directories from the request /test/sub/sub2/1/2/', function (done) {
		request.GET(http + '/test/sub/sub2/1/2/', null, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body.method, 'sub2/index');
			done();
		});
	});

	it('can handle sub directories from the request /test/sub/sub2/foo/1/2/', function (done) {
		request.GET(http + '/test/sub/sub2/foo/1/2/', null, options, function (error, body, status) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body.method, 'sub2/foo');
			done();
		});
	});

	it('can handle sub directories from the request /test/sub/one/two with parameters', function (done) {
		request.GET(http + '/test/sub/one/two/', null, options, function (error, body, status) {
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

	it('can handle sub directories from the request /test/sub/sub2/one/two with parameters', function (done) {
		request.GET(http + '/test/sub/sub2/one/two/', null, options, function (error, body, status) {
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
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert(error);
			assert.equal(body.message, 'name must be a string');
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

	it('can read a GET query string with a trailing slash', function (done) {
		request.GET(http + '/test/get2?boo=BOO&foo=FOO', null, options, function (error, body, status) {
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
			assert.equal(headers.url, dummy + '/redirect/dest/');
			done();
		});
	});

	it('can force trailing slash with GET a query', function (done) {
		request.GET(http + '/redirect/dest/?example=true', null, options, function (error, body, status, headers) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(headers.url, dummy + '/redirect/dest/?example=true');
			done();
		});
	});

	it('can force trailing slash with GET queries', function (done) {
		request.GET(http + '/redirect/dest/?example=true&test=1', null, options, function (error, body, status, headers) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(headers.url, dummy + '/redirect/dest/?example=true&test=1');
			done();
		});
	});

	it('does not force trailing slash with a GET query and trailing slash', function (done) {
		request.GET(http + '/redirect/dest/?example=true', null, options, function (error, body, status, headers) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(headers.url, dummy + '/redirect/dest/?example=true');
			done();
		});
	});

	it('does not force trailing slash with GET queries and trailing slash', function (done) {
		request.GET(http + '/redirect/dest/?example=true&test=1', null, options, function (error, body, status, headers) {
			assert.equal(allRequestHookCalled, true);
			allRequestHookCalled = false;
			assert.equal(headers.url, dummy + '/redirect/dest/?example=true&test=1');
			done();
		});
	});

	/*
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
	*/

	it('can apply URL prefix and route the request correctly', function (done) {
		request.GET(http + '/test/params/one/two/', null, options, function (error, body, status) {
			assert.equal(error, undefined);
			assert.equal(body.one, 'one');
			assert.equal(body.two, 'two');
			assert.equal(status, 200);
			done();
		});
	});

	it('can get 404 response when sending a request with an incorrect method', function (done) {
		request.PUT(http + '/test/params/one/two/', null, options, function (error, body, status) {
			assert(error);
			assert(body);
			assert.equal(status, 404);
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
		request.PATCH(http + '/patch/', { data: data }, options, function (error, body, status) {
			assert.equal(error, undefined);
			assert.equal(body.data, data);
			assert.equal(status, 200);
			done();
		});	
	});

	it('can define typed params', function (done) {
		request.GET(http + '/num/100/0.4', null, options, function (error, res, st) {
			assert.equal(error, null);
			assert.strictEqual(res.int, 100);
			assert.strictEqual(res.float, 0.4);
			assert.equal(st, 200);
			done();
		});
	});

	it('can listen on unexpected connection close', function (done) {
		gn.router.get('/close', function (req, res) {
			res.onClose(function () {
				done();
			});
		});
		var opt = {
			timeout: 100
		};
		for (var i in options) {
			opt[i] = options[i];
		}
		request.GET(http + '/close', null, opt, function () {
			// do nothing here
		});
	});

	it('can ready request body w/ content-type: application/json header', function (done) {
		gn.router.post('/postman', function (req, res) {
			res.json(req.body.json);
		});
		var opt = {
			gzip: true,
			headers: {
				'Content-Type': 'application/json'
			}
		};
		var params = {
			json: {
				one: 1,
				two: '2',
				list: [1, 2, 3]
			}
		};
		request.POST(http + '/postman/', params, opt, function (error, res, st) {
			assert.equal(error, null);
			assert.equal(res.one, 1);
			assert.equal(res.two, '2');
			assert.equal(res.list.length, 3);
			assert.equal(st, 200);
			done();
		});
	});

	it('can handle URL case insensitive', function (done) {
		gn.router.get('/hello', function (req, res) {
			res.json({ message: 'hello' });
		});
		request.GET(http + '/Hello', {}, options, function (error, res, st) {
			assert.equal(error, null);
			assert.equal(res.message, 'hello');
			assert.equal(st, 200);
			done();
		});
	});

	it('can handle URL case sensitive', function (done) {
		gn.router.get('/hi', function (req, res) {
			res.json({ message: 'hi' });
		}, { sensitive: true });
		request.GET(http + '/Hi', {}, options, function (err, r, s) {
			assert(err);
			assert.equal(r, 'not found');
			assert.equal(s, 404);
			request.GET(http + '/hi', {}, options, function (error, res, st) {
				assert.equal(error, null);
				assert.equal(res.message, 'hi');
				assert.equal(st, 200);
				done();
			});
		});
	});

	it('can handle requests at the same time', function (done) {
		gn.router.get('/busy/{number:id}', function (req, res) {
			res.json({ message: req.params.id });
		});
		var max = 3;
		var counter = 0;
		var total = 10;
		var tcounter = 0;
		var call = function () {
			request.GET(http + '/busy/' + counter, {}, options, function (error, res, st) {
				assert.equal(error, null);
				assert.equal(st, 200);
				tcounter += 1;
				if (tcounter === total) {
					done();
				}
			});
		};
		for (var i = 0; i < total; i++) {
			call();
			counter += 1;
			if (counter === max) {
				counter = 0;
			}
		}
	});

	it('can define a route after gracenode.start()', function () {
		gn.router.post('/test3/{number:one}/test3/{string:two}/{bool:three}', function (req, res) {
			res.json({
				one: req.params.one,
				two: req.params.two,
				three: req.params.three,
				four: req.body.four,
				five: req.query.five
			});
		});
	});

	it('can handle /test3/{number:one}/test3/{string:two}/{bool:three}', function (done) {
		request.POST(http + '/test3/1/test3/2/true/?five=5', { four: 4 }, options, function (error, res, st) {
			assert.equal(error, null);
			assert.equal(res.one, 1);
			assert.equal(res.two, '2');
			assert.equal(res.three, true);
			assert.equal(res.four, 4);
			assert.equal(res.five, 5);
			assert.equal(st, 200);
			done();
		});
	});

	it('can handle /test3/{number:one}/test3/{string:two}/{bool:three} w/ different values', function (done) {
		request.POST(http + '/test3/10/test3/20/false/?five=50', { four: 40 }, options, function (error, res, st) {
			assert.equal(error, null);
			assert.equal(res.one, 10);
			assert.equal(res.two, '20');
			assert.equal(res.three, false);
			assert.equal(res.four, 40);
			assert.equal(res.five, 50);
			assert.equal(st, 200);
			done();
		});
	});

	it('can handle /test4/{middle}/boo', function (done) {
		gn.router.post('/test4/{middle}/boo', function (req, res) {
			res.json({
				middle: req.params.middle
			});
		});
		request.POST(http + '/test4/FOO/boo/', { }, options, function (error, res, st) {
			assert.equal(error, null);
			assert.equal(res.middle, 'FOO');
			assert.equal(st, 200);
			done();
		});
	});

	it('can handle object param /test5/{object:obj}/foo', function (done) {
		gn.router.post('/test5/{object:obj}/foo', function (req, res) {
			res.json({
				obj: req.params.obj
			});
		});
		request.POST(http + '/test5/{"one":1,"two":"2","three":[1,2,3]}/foo/', { }, options, function (error, res, st) {
			assert.equal(error, null);
			assert.equal(typeof res.obj, 'object');
			assert.equal(res.obj.one, 1);
			assert.equal(res.obj.two, 2);
			assert.equal(res.obj.three[0], 1);
			assert.equal(res.obj.three[1], 2);
			assert.equal(res.obj.three[2], 3);
			assert.equal(st, 200);
			done();
		});
	});

	it('can handle fast route /fast', function (done) {
		gn.router.post('/fast', function (req, res) {
			res.json({ message: 'fast' });
		});
		request.POST(http + '/fast/', { }, options, function (error, res, st) {
			assert.equal(error, null);
			assert.equal(res.message, 'fast');
			assert.equal(st, 200);
			done();
		});
	});

	it('can handle fast route /fast/1', function (done) {
		gn.router.get('/fast/1', function (req, res) {
			res.json({ message: 'fast/1' });
		});
		request.GET(http + '/fast/1/', { }, options, function (error, res, st) {
			assert.equal(error, null);
			assert.equal(res.message, 'fast/1');
			assert.equal(st, 200);
			done();
		});
	});

	it('can handle fast route /fast/1/2', function (done) {
		gn.router.put('/fast/1/2', function (req, res) {
			res.json({ message: 'fast/1/2' });
		});
		request.PUT(http + '/fast/1/2/', { }, options, function (error, res, st) {
			assert.equal(error, null);
			assert.equal(res.message, 'fast/1/2');
			assert.equal(st, 200);
			done();
		});
	});

	it('cannot handle fast route /fast/1/2/3', function (done) {
		request.PUT(http + '/fast/1/2/3/', { }, options, function (error, res, st) {
			assert(error);
			assert.equal(st, 404);
			done();
		});
	});

	it('can go through /test route hook (fast routing)', function (done) {
		gn.router.get('/test/fast', function (req, res) {
			if (!req.args.testRoute) {
				return res.error(new Error('NotGoingThroughTestRouteHook'), 500);
			}
			res.json({ message: 'OK' });
		});
		request.GET(http + '/test/fast', {}, options, function (error, res, st) {
			assert.equal(error, null);
			assert.equal(st, 200);
			assert.equal(res.message, 'OK');
			done();
		});
	});

	it('can define static file route', function () {
		gn.router.static('/static', [ '../../../test/router/static/' ]);
	});

	it('can handle static file route', function (done) {
		var opt = {
			gzip: false
		};
		request.GET(http + '/static/test/router/static/spinner.gif', {}, opt, function (error, res, st) {
			assert.equal(error, null);
			assert.equal(st, 200);
			done();
		});
	});

	it('can handle /', function (done) {
		request.GET(http + '/', { }, options, function (error, res, st) {
			assert.equal(error, null);
			assert.equal(st, 200);
			assert.equal(res.message, '/');
			done();
		});
	});

	it('can handle /Test (case insensitive)', function (done) {
		request.GET(http + '/Test', { }, options, function (error, res, st) {
			assert.equal(error, null);
			assert.equal(st, 200);
			assert.equal(res, 'index');
			done();
		});
	});

	it('can handle /{param}/wow', function (done) {
		gn.router.get('/{param}/wow', function (req, res) {
			res.json({ message: req.params.param });
		});
		request.GET(http + '/BOO/wow', {}, options, function (error, res, st) {
			assert.equal(error, null);
			assert.equal(st, 200);
			assert.equal(res.message, 'BOO');
			done();
		});
	});

	it('can handle invalid named param type /test100/{number:num}', function (done) {
		gn.router.get('/test100/{number:num}', function (req, res) {
			res.json({ message: req.params.param });
		});
		request.GET(http + '/test100/AAA', {}, options, function (error, res, st) {
			assert(error);
			assert.equal(st, 400);
			assert.equal(res.message, 'InvalidNumber: AAA');
			done();
		});
	});

	it('can handle all named params', function (done) {
		gn.router.get('/{one}/{two}/{three}', function (req, res) {
			res.json({ message: req.params.one + req.params.two + req.params.three });
		});
		request.GET(http + '/1/2/3', {}, options, function (error, res, st) {
			assert.equal(error, null);
			assert.equal(st, 200);
			assert.equal(res.message, '123');
			done();
		});
	});
});

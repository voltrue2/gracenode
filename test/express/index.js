var logEnabled = process.argv[process.argv.length - 1].replace('--log=', '') === 'true' ? true : false;
var port = 9899;
var assert = require('assert');
var request = require('./request');
var gn = require('../../src/gracenode');
var http = 'http://localhost:' + port;

describe('gracenode w/ express', function () {

	it('can set up express as gracenode module', function (done) {
		gn.config({
			log: {
				console: logEnabled
			},
			router: {
				port: null,
				host: null
			}
		});
		gn.use('express', require('express'));
		gn.start(function () {
			var logger = gn.log.create();
			assert(gn.mod.express);
			gn.mod.express().listen(port);
			logger.info('express server started listening:', port);
			done();
		});
	});

	it('can define a route GET /test', function () {
		var router = gn.mod.express.Router();
		router.get('/get', function (req, res) {
			res.render('/get', { title: '/get' });
		});
	});

	it('can handle a request to defined GET /test', function (done) {
		request.GET(http + '/test', null, null, function (error) {
			assert.equal(error, null);
			done();
		});
	});

});

var request = require('../../test/server/request');

var port = 5555;
var domain = 'http://localhost:' + port;

var gn = require('../gracenode');

gn.config({
	router: {
		port: port,
		host: 'localhost'
	},
	log: {
		color: true
	}
});

gn.start(function () {
	
	var router = gn.router;

	router.register('GET', '/test/{var}', function (req, res) {
		res.json({ OK: true });
	});

	router.register('GET', '/double', function (req, res) {
		res.json({ OK: true });
		res.json({ OK: true });
	});

	router.hook('/test/{var}', function test(req, res, next) {
		req.args.counter = req.args.counter || 0;
		req.args.counter += 1;
		next();
	});

	router.hook('/test/{var}', function test2(req, res, next) {
		req.args.counter += 1;
		next();
	});
	
	// start request tests
	request.GET(domain + '/test/foo?q=1000', { q2: 1 }, { gzip: true }, function () {
	});
	
	request.POST(domain + '/test/foo', { q1: 1000, q2: 1 }, { gzip: true }, function () {
	});
	
	request.GET(domain + '/double', { q1: 1000, q2: 1 }, { gzip: true }, function () {
	});

});

var request = require('../../test/server/request');
var router = require('./index.js');

var port = 5555;
var domain = 'http://localhost:' + port;

router.config({ port: port });

router.register('GET', '/test/{var}', function (req, res) {
	console.log('response: args, params, query, body', req.args, req.params, req.query, req.body);
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

router.setup(function (error) {

	if (error) {
		return console.error(error);
	}

	request.GET(domain + '/test/foo?q=1000', { q2: 1 }, { gzip: true }, function () {
		console.log('reponnse received:', arguments);
	});

});

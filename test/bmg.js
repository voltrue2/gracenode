var msg = { message: 'OK' };
var req = require('./src/request');
var gn = require('../src/gracenode');
var maxcalls = 600;
var loopmax = 10;
var loop = 0;
var total = 0;

gn.config({
	log: {
		//console: false
	},
	router: {
		host: 'localhost',
		port: 9900
	}
});

gn.start(function () {
	gn.router.get('/test', function (req, res) {
		res.gzip(false);
		res.json(msg);
	});
	caller();
});

function caller() {
	console.log('Starting benchmark: gracenode for', maxcalls, 'requests...');
	var s = Date.now();
	var c = 0;
	var ec = 0;
	call(s, c, ec);
}

function call(start, count, ecount) {
	req.GET('http://localhost:9900/test', {}, { gzip: false }, function (error, res, st) {
		if (error || st >= 400) {
			ecount++;
		} else {
			count++;
		}
		if (ecount + count < maxcalls) {
			return call(start, count, ecount);
		}
		// done
		var time = Date.now() - start;
		console.log(maxcalls, 'requests handled in', time, 'ms', 'errors:', ecount);
		total += time;
		loop++;
		if (loop === loopmax) {
			console.log('>>>> agerage', (total / loopmax), 'ms for', maxcalls, 'requests');
			gn.stop();
		}
		// next loop
		caller();
	});
}

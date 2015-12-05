var msg = { message: 'OK' };
var req = require('./src/request');
var express = require('express');
var maxcalls = 600;
var loopmax = 10;
var loop = 0;
var total = 0;

var app = express();
var router = express.Router();

router.get('/test', function (req, res) {
	res.json(msg);
}); 

app.listen(9900);

caller();

function caller() {
	console.log('Starting benchmark: express for', maxcalls, 'requests...');
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
			process.exit();
		}
		// next loop
		caller();
	});
}

var msg = { message: 'OK' };
var req = require('./src/request');
var gn = require('../src/gracenode');
var maxcalls = 600;
var loopmax = 10;
var loop = 0;
var total = 0;
var len = 100;

var nothing = function (req, res) {
    res.json(msg);
};

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
    for (var i = 0; i < len; i++) {
        gn.router.get('/dummy/{xxx' + i + '}', nothing);
    }
    gn.router.get('/test/{what}', function (req, res) {
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
    req.GET('http://localhost:9900/test/{what}', {}, { gzip: false }, function (error, res, st) {
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
            console.log('>>>> gracenode agerage', (total / loopmax), 'ms for', maxcalls, 'requests');
            gn.stop();
        }
        // next loop
        caller();
    });
}

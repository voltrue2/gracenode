var express = require('express');
var gn = require('../src/gracenode');
var req = require('./src/request');
var dur = 1000;
var eport = 2222;
var gport = 3333;
var cnt = 0;
var ecnt = 0;
var opt = { gzip: false };
var fnc = function () {};
var loop = 0;
var loopmax = 10;
var ct = 0;
var et = 0;
var method = process.argv[3] || 'get';
var METHOD = method.toUpperCase();

if (process.argv[2] === 'express') {
    console.log('Test express');
    var app = express();
    app[method]('/', fnc);
    for (var i = 0; i < 100; i++) {
        app.get('/' + i + 'xxxx', fnc);
    }
    app[method]('/test/:var1/:var2/:var3/test', ehandle);
    app.listen(eport);
    spam(eport);
    var done = function () {
        loop += 1;
        ct += cnt;
        et += ecnt;
        console.log(loop, dur + 'ms', cnt, ecnt);
        cnt = 0;
        ecnt = 0;
        if (loop === loopmax) {            
            console.log('DONE', dur + 'ms: average = ', (ct / loopmax), et);
            process.exit();
        } else {
            setTimeout(done, dur);
        }
    };
    setTimeout(done, dur);
} else if (process.argv[2] === 'gracenode') {
    console.log('Test gracenode');
    var done = function () {
        loop += 1;
        ct += cnt;
        et += ecnt;
        console.log(loop, dur + 'ms', cnt, ecnt);
        cnt = 0;
        ecnt = 0;
        if (loop === loopmax) {            
            console.log('DONE', dur + 'ms: average = ', (ct / loopmax), et);
            gn.stop();
        } else {
            setTimeout(done, dur);
        }
    };
    gn.config({
        log: {
            console: false,
        },
        router: {
            host: 'localhost',
            port: gport
        }
    });
    gn.router[method]('/', fnc);
    for (var i = 0; i < 100; i++) {
        gn.router.get('/' + i + 'xxxx', fnc);
    }
    gn.router[method]('/test/{var1}/{var2}/{var3}/test', ghandle, { readBody: false });
    gn.start(function () {
        spam(gport);
        setTimeout(done, dur);
    });
} else {
    console.log('Test raw http');
    var http = require('http');
    var server = http.createServer(function (req, res) {
        res.end(JSON.stringify({ time: Date.now() }));
    });
    server.listen(eport);
    spam(eport);
    var done = function () {
        loop += 1;
        ct += cnt;
        et += ecnt;
        console.log(loop, dur + 'ms', cnt, ecnt);
        cnt = 0;
        ecnt = 0;
        if (loop === loopmax) {            
            console.log('DONE', dur + 'ms: average = ', (ct / loopmax), et);
            process.exit();
        } else {
            setTimeout(done, dur);
        }
    };
    setTimeout(done, dur);
}

function ehandle(req, res) {
    res.json({ time: Date.now() });
}

function ghandle(req, res) {
    res.gzip(false);
    res.json({ time: Date.now() });
}

function spam(port) {
    req[METHOD]('http://localhost:' + port + '/test/1/2/3/test', {}, opt, function (error, res, st) {
        if (error || st >= 400) {
            ecnt += 1;
        } else {
            cnt += 1;
        }
        spam(port);
    });
}

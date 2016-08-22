'use strict';

var gn = require('../../src/gracenode');
var logger;

gn.config({
	log: {
		color: true,
		console: true,
		level: '>= warn'
	},
	cluster: {
		max: process.argv[2] || 0,
		sync: process.argv[3] === 'true' ? true : false
	},
	http: {
		host: '127.0.0.1',
		port: 7979
	},
	rpc: {
		host: '127.0.0.1',
		portRange: [9880]
	}
});

gn.http.post('/auth', handleAuth);
gn.session.sessionDuration(100000);
gn.session.useRPCSession();
console.log('Starting RPC server in secure mode');

gn.cluster.on('message', function (/*msg*/) {
	//console.log('cluster message sync:', msg);
});

gn.rpc.command(1, 'test1', function (state, cb) {
	//console.log('we have data:', state.payload);
	var workers = gn.cluster.getWorkers();
	for (var id in workers) {
		gn.cluster.send(id, { message: Date.now() });
	}
	cb({ message: 'OK' });
});

gn.rpc.hook(function all(state, next) {
	//console.log('hook got called!');
	next();
});

gn.rpc.hook(1, function hookForOne(state, next) {
	//console.log('hook for one');
	next();
});

gn.start(function () {
	logger = gn.log.create('rpc.server');
	var initSize = process.memoryUsage().heapUsed;
	var prevSize = initSize;
	logger.warn('used memory heap size', initSize);
	var dump = function () {
		var currentSize = process.memoryUsage().heapUsed;
		logger.warn('used memory heap size', currentSize, currentSize - prevSize, currentSize - initSize);
		prevSize = currentSize;
		setTimeout(dump, 1000 * 60);
	};
	setTimeout(dump, 1000 * 60);
});

function handleAuth(req, res) {
        var data = { message: 'session data' };
        gn.session.setHTTPSession(req, res, data, function (error) {
                if (error) {
                        return res.error(error);
                }
		var info = gn.rpc.info();
                res.json({
                        sessionId: req.args.sessionId,
                        host: info.host,
                        port: info.port,
                        cipherData: req.args.cipher
                });
        });
}


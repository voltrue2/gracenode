'use strict';

var gn = require('../../src/gracenode');

gn.config({
	log: {
		color: true,
		console: true,
		level: '>= verbose'
	},
	cluster: {
		max: process.argv[2] || 0,
		sync: process.argv[3] === 'true' ? true : false
	},
	http: {
		host: '0.0.0.0',
		port: 7979
	},
	rpc: {
		host: '0.0.0.0',
		portRange: [9876, 9880]
	}
});

gn.http.post('/auth', handleAuth);
gn.session.sessionDuration(100000);
gn.session.useRPCSession();
console.log('Starting RPC server in secure mode');

gn.cluster.on('message', function (msg) {
	console.log('cluster message sync:', msg);
});

gn.rpc.command(1, 'test1', function (state, cb) {
	console.log('we have data:', state.payload);
	var workers = gn.cluster.getWorkers();
	for (var id in workers) {
		gn.cluster.send(id, { message: Date.now() });
	}
	cb({ message: 'OK' });
});

gn.rpc.hook(function all(state, next) {
	console.log('hook got called!');
	next();
});

gn.rpc.hook(1, function hookForOne(state, next) {
	console.log('hook for one');
	next();
});

gn.start();

function handleAuth(req, res) {
        var data = { message: 'session data' };
        gn.session.setHTTPSession(req, res, data, function (error) {
                if (error) {
                        return res.error(error);
                }
                res.json({
                        sessionId: req.args.sessionId,
                        host: '0.0.0.0',
                        port: 7980,
                        cipherData: req.args.cipher
                });
        });
}


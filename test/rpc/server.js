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
	rpc: {
		host: '0.0.0.0',
		portRange: [9876, 9880]
	}
});

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

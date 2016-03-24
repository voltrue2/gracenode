'use strict';

var gn = require('../../src/gracenode');

gn.config({
	log: {
		color: true,
		console: true,
		level: '>= verbose'
	},
	cluster: {
		max: 0
	},
	rpc: {
		host: 'localhost',
		portRange: [9876, 9880]
	}
});

gn.rpc.command(1, 'test1', function (state, cb) {
	console.log('we have data');
	cb(null, { message: 'OK' });
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

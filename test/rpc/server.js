'use strict';

var gn = require('../../src/gracenode');

gn.config({
	log: {
		color: true,
		console: true,
		level: '>= verbose'
	},
	cluster: {
		max: 2
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
	if (gn.lib.randomInt(0, 1)) {
		// 50% percent of chance to respond to the client here
		return next(new Error('hook one 50% error'));
	}
	next();
});

gn.rpc.hook(1, function hookForOne(state, next) {
	console.log('hook for one');
	next();
});

gn.start();

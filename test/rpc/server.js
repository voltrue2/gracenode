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
	console.log('data', state.payload);
	cb({ message: 'OK' });
});

gn.start();

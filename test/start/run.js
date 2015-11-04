var gn = require('../../src/gracenode');

gn.config({
	cluster: {
		max: 1 
	}
});

gn.config({
	cluster: {
		max: 0
	},
	withConf: {
		value: 'foo'
	}
});

gn.use('async', require('async'));

if (process.argv[2] && process.argv[3]) {
	gn.use(process.argv[2], process.argv[3]);
}

if (process.argv[4] && process.argv[5]) {
	gn.use(process.argv[4], process.argv[5]);
}

gn.start(function () {
	if (!gn.mod.async) {
		gn.stop(new Error('noAsync'));
	}
	gn.stop();
});

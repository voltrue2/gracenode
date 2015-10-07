var gn = require('../../src/gracenode');

gn.config({
	cluster: {
		max: 0
	},
	withConf: {
		value: 'foo'
	}
});

if (process.argv[2] && process.argv[3]) {
	gn.use(process.argv[2], process.argv[3]);
}

if (process.argv[4] && process.argv[5]) {
	gn.use(process.argv[4], process.argv[5]);
}

gn.start(function () {
	gn.stop();
});

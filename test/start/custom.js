var gn = require('../../src/gracenode');

gn.config({
	cluster: {
		max: 2,
		sync: false
	},
	staticdata: {
		path: '../data/csv/'
	}
});

gn.use('staticdata', '../../node_modules/staticdata', {
	config: function (config) {
		config.path = gn.getRootPath() + config.path;
		this.config = config;
	},
	setup: function (cb) {
		this.setup(this.config, cb);
	},
	exit: function (cb) {
		cb();
	}
});

gn.start(function () {
	if (!gn.isMaster()) {
		var sd = gn.mod.staticdata.create('one');
		var row = sd.getOne(0);
		if (row.one !== 1 || row.two !== 2) {
			gn.stop(new Error('failed to read CSV data'));
		} else {		
			gn.stop();
		
		}
	}
});

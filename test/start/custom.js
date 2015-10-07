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
	}
});

gn.start(function () {
	//var sd = gn.mod.staticdata.create('one');
	setTimeout(function () {
		gn.stop();
	}, 1000);
});

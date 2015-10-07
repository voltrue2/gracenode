var gn = require('../src/gracenode');

gn.config(require('./config.json'));

gn.use('async', '../node_modules/async');
gn.use('withExitTask', './modules/withexittask', {
	config: function (configIn) {
		this.logger = gn.log.create(this.name);
		this.logger.warn('config:', configIn);
	},
	setup: function (cb) {
		this.logger.warn('setup() called');
		cb();
	},
	exit: function (cb) {
		this.logger.warn('exit called');
		cb();
	}
});

gn.start(function () {
	setTimeout(function () {
		//throw new Error('foo');
	}, 3000);
});

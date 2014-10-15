var glog = require('gracelog');

// overwrite .create() to remove the full file path in default log name
var create = glog.create;

glog.create = function (name) {
	var logger = create(name);
	if (!name) {
		// there was no log name given
		// we will be using default log name
		// remove the root path
		logger.name = logger.name.replace(module.exports.gracenode.getRootPath(), '');
	}
	return logger;
};

module.exports = glog;

// assigned by gracenode sliently...
module.exports.gracenode = null;

module.exports.readConfig = function (configData) {
	glog.config(configData);
};

module.exports.setup = function (cb) {
	// set up a cleaning up on gracenode exit
	module.exports.gracenode._addLogCleaner('exit', function (done) {
		glog.clean(done);
	});
	// we are done
	cb();
};

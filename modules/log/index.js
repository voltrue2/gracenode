var glog = require('gracelog');

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

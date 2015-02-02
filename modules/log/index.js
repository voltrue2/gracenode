'use strict';

var glog = require('gracelog');
var LOG_PATHS = {
	GLOG: 'gracelog/index.js',
	LOG: 'gracenode/modules/log/index.js'
};

// overwrite .create() to remove the full file path in default log name
var create = glog.create;

glog.create = function (name) {
	if (!name && module.exports.gracenode) {
		var stack = new Error('').stack.split('\n');
		// index 0 is always "Error"
		for (var i = 1, len = stack.length; i < len; i++) {
			if (stack[i].indexOf(LOG_PATHS.GLOG) === -1 && stack[i].indexOf(LOG_PATHS.LOG) === -1) {
				name = stack[i].substring(stack[i].indexOf('/'), stack[i].lastIndexOf('.'));
				break;
			}
		}
		name = name.replace(module.exports.gracenode.getRootPath(), '');
	}
	return create(name);
};

module.exports = glog;

// assigned by gracenode sliently...
module.exports.gracenode = null;

module.exports.readConfig = function (configData) {
	var debugConf = module.exports.gracenode.config.getOne('gracenode-debug');
	if (debugConf) {
		// we are in debug mode and forcing verbose
		if (!configData) {
			configData.console = true;
			configData.color = true;
		}
		configData.showHidden = true;
		configData.depth = 20;
		configData.level = '>= verbose';
	}
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

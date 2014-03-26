
/*
 *  configurations
 *
 * {
 *		"log": {
			"file": <path to log directory> or false
			"remote": {
				"host": <optional>
				"port": <optional>
			},
 *			"color": true/false,
 *			"level": {
				"verbose": <boolean>
				"debug": <boolean>
				"info": <boolean>
				"warning": <boolean>
				"error": <boolean>
				"fatal": <boolean>
*			}
 *		}
 * }
 *
 * */
var loggerSource = require('./logger');

var config = null;
var prefix = '';

module.exports.readConfig = function (configIn) {
	if (!configIn) {
		throw new Error('invalid configurations:\n' + JSON.stringify(configIn, null, 4));
	}
	
	config = configIn;

	loggerSource.setup(module.exports.gracenode, config);
	
	return true;
};

module.exports.setup = function (cb) {
	cb();
};

module.exports.setPrefix = function (p) {
	prefix = p;
};

module.exports.create = function (name) {
	return new loggerSource.Logger(prefix, name, config);
};

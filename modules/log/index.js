
/*
 *  configurations
 *
 * {
 *		"log": {
 *			"type": "stdout", "remote" or "file"
			"remoteServer": {
				"host": <optional>
				"port": <optional>
			},
 *			"color": true/false,
 *			"level": {
 *				"verbose": { "enabled": true/false, "path": "file path (required only if type is file)" },
 *				"debug": { "enabled": true/false, "path": "file path (required only if type is file)" },
 *				"info": { "enabled": true/false, "path": "file path (required only if type is file)" },
 *				"warning": { "enabled": true/false, "path": "file path (required only if type is file)" },
 *				"error": { "enabled": true/false, "path": "file path (required only if type is file)" },
 *				"fatal": { "enabled": true/false, "path": "file path (required only if type is file)" }
 *			}
 *		}
 * }
 *
 * */
var loggerSource = require('./logger');

var config = null;
var prefix = '';

module.exports.readConfig = function (configIn) {
	if (!configIn || !configIn.type) {
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

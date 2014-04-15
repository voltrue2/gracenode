
/*
 *  configurations
 *
 * {
 *		"log": {
			"file": <path to log directory> or false
			"remote": {
				"host": 
				"port": 
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
var EventEmitter = require('events').EventEmitter;

var config = null;
var prefix = '';

module.exports = new EventEmitter();

module.exports.readConfig = function (configIn) {
	if (!configIn) {
		throw new Error('invalid configurations:\n' + JSON.stringify(configIn, null, 4));
	}
	
	config = configIn;
	
	return true;
};

module.exports.setup = function (cb) {
	loggerSource.setup(module.exports.gracenode, config);
	cb();
};

module.exports.setPrefix = function (p) {
	prefix = p;
};

module.exports.create = function (name) {
	return new loggerSource.Logger(prefix, name, config);
};

loggerSource.events.on('output', function (address, name, level, data) {
	module.exports.emit('output', address, name, level, data);
});

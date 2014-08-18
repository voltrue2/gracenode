var loggerSource = require('./logger');
var EventEmitter = require('events').EventEmitter;

var config = null;
var prefix = '';
var appPrefix = '';

module.exports = new EventEmitter();

loggerSource.events.on('output', function (address, name, level, data) {
	module.exports.emit('output', address, name, level, data);
});

module.exports.readConfig = function (configIn) {
	
	config = configIn;

	// there is no configurations, we create a default one
	if (!config) {
		config = {
			console: true,
			color: true,
			level: '>= verbose'
		};
		console.warn('<warn>[log] no configurations for log module found: created default configurations');
		console.log('<verbose>[log] default configurations:\n', {
			console: true,
			color: true,
			level: '>= verbose'
		});
	}

	// if config level is missing, we create a default one
	if (!config.level) {
		config.level = '>= verbose';
		console.warn('<warn>[log] no log level found: created default log level');
		console.log('<verbose>[log] default configurations:\n', config);
	}

	if (config.level && typeof config.level === 'string') {
		// for backward compatibility:
		if (config.level.indexOf('warning') !== -1) {
			config.level = config.level.replace('warning', 'warn');
		}
		// we now support a string format of level
		// e.i. "level": ">= info"
		var sep = config.level.split(' ');
		var operators = ['>', '<', '>=', '<=', '='];
		var levels = ['verbose', 'debug', 'trace', 'info', 'warn', 'error', 'fatal'];
		var level = {};
		var op = null;
		var lvl = null;
		for (var k = 0, ken = sep.length; k < ken; k++) {
			if (operators.indexOf(sep[k]) !== -1) {
				op = sep[k];
			} else if (levels.indexOf(sep[k]) !== -1) {
				lvl = sep[k];
			}
		}
		if (lvl) {
			if (op) {
				if (op.indexOf('<') !== -1) {
					levels.reverse();
				}
				var start = levels.indexOf(lvl);
				if (op.indexOf('=') === -1) {
					start += 1;
				}
				for (var j = start, jen = levels.length; j < jen; j++) {
					level[levels[j]] = true;
				}
			} else {
				level[lvl] = true;
			}
		}
		config.level = level;

	} else if (config.level && Array.isArray(config.level)) {
		// we now support an array format of level
		var levelObj = {};
		for (var i = 0, len = config.level.length; i < len; i++) {
			// for backward compatibility:
			if (config.level[i] === 'warning') {
				config.level[i] = 'warn';
			}
			levelObj[config.level[i]] = true;
		}
		config.level = levelObj;
	}
	
	// for backward compatibility:
	if (config.level.warning) {
		config.level.warn = config.level.warning;
		delete config.level.warning;
	}

	return true;
};

module.exports.setup = function (cb) {
	loggerSource.setup(module.exports.gracenode, config);
	cb();
};

module.exports.setPrefix = function (p) {
	appPrefix = p;
};

module.exports._setInternalPrefix = function (p) {
	prefix = p;
};

module.exports.create = function (name) {
	var p = prefix;
	if (prefix !== '' && appPrefix) {
		p = prefix + '][' + appPrefix;
	} else if (appPrefix) {
		p = appPrefix;
	}
	return loggerSource.create(p, name, config);
};

module.exports.forceFlush = function (cb) {
	loggerSource.forceFlush(cb);
};

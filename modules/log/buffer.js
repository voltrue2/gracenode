var async = require('async');
var buff = {
	'verbose': {
		messages: [],
		timestamps: [],
		size: 0
	},
	'debug': {
		messages: [],
		timestamps: [],
		size: 0
	},
	'info': {
		messages: [],
		timestamps: [],
		size: 0
	},
	'warning': {
		messages: [],
		timestamps: [],
		size: 0
	},
	'error': {
		messages: [],
		timestamps: [],
		size: 0
	},
	'fatal': {
		messages: [],
		timestamps: [],
		size: 0
	}
};
// default 8 KB
var limit = 8192;
// default is 5 seconds
var autoFlushInterval = 5000;
// a list of logger objects
var loggers = [];

module.exports.setup = function (size, interval) {
	if (size) {
		limit = size;
	}
	if (interval) {
		autoFlushInterval = interval;
	}
	module.exports._timerFlush();
};

module.exports.addLogger = function (logger) {
	loggers.push(logger);
};

module.exports.add = function (level, msg) {
	buff[level].messages.push(msg.message);
	buff[level].timestamps.push(msg.timestamp);
	buff[level].size += Buffer.byteLength(msg.message);
	if (buff[level].size > limit) {
		return module.exports.flush(level);
	}
	return null;
};

module.exports.flush = function (level) {
	if (buff[level].size) {
		var data = { 
			messages: buff[level].messages,
			timestamps: buff[level].timestamps
		};
		buff[level].messages = [];
		buff[level].timestamps = [];
		buff[level].size = 0;
		return data;
	}
	return null;
};

module.exports.flushAll = function () {
	var flushed = {};
	for (var level in buff) {
		flushed[level] = module.exports.flush(level);
	}
	return flushed;
};

module.exports._timerFlush = function () {
	// auto flush buffered log data at x miliseconds
	// Node.js timer implementation should be effecient for handling lots of timers
	// https://github.com/joyent/node/blob/master/deps/uv/src/unix/timer.c #120
	setTimeout(function () {
		async.eachSeries(loggers, function (logger, next) {
			logger._autoFlush(next);
		}, module.exports._timerFlush);
	}, autoFlushInterval);
};

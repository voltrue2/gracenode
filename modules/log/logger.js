var async = require('async');
var gracenode;
var ip = require('./lib/ip');
var msg = require('./lib/msg');
var file = require('./lib/file');
var remote = require('./lib/remote');
var buff = require('./buffer');
var EventEmitter = require('events').EventEmitter;
var events = new EventEmitter();
var address = null;
// a list of logger objects for auto flush
var loggers = [];
// default is 5 seconds
var autoFlushInterval = 5000;

module.exports.setup = function (gn, config) {
	ip.setup();
	address = ip.get();
	msg.setup(config);
	file.setup(gn, config.level, config.file);
	remote.setup(config.remote);
	buff.setup(config.bufferSize);
	gracenode = gn;
	if (config.bufferFlushInterval) {
		autoFlushInterval = config.bufferFlushInterval;
	}
	// register graceful shutdown task to flush all log data before exit
	gracenode._addLogCleaner('exit', function (done) {
		module.exports.forceFlush(done);
	});
	// auto flush log data at every x milliseconds
	module.exports._timerFlush();
};

module.exports.create = function (prefix, name, config) {
	var logger = new Logger(prefix, name, config);
	loggers.push(logger);
	return logger;
};

module.exports.events = events;

module.exports._timerFlush = function () {
	// auto flush buffered log data at x miliseconds
	// Node.js timer implementation should be effecient for handling lots of timers
	// https://github.com/joyent/node/blob/master/deps/uv/src/unix/timer.c #120
	setTimeout(function () {
		module.exports.forceFlush(module.exports._timerFlush);
	}, autoFlushInterval);
};

module.exports.forceFlush = function (cb) {
	async.each(loggers, function (logger, next) {
		logger._autoFlush(next);
	}, cb);

};

function Logger(prefix, name, config) {
	this.prefix = prefix;
	this.name = name;
	this.config = config || {};
}

Logger.prototype.verbose = function () {
	this._handleLog.apply(this, ['verbose', arguments]);
};

Logger.prototype.debug = function () {
	this._handleLog.apply(this, ['debug', arguments]);
};

Logger.prototype.trace = function () {
	var traceError = new Error('<stack trace>');
	var trace = traceError.stack.replace('Error: ', '');
	this._handleLog.apply(this, ['trace', arguments]);
	this._handleLog('trace', [trace]);
};

Logger.prototype.info = function () {
	this._handleLog.apply(this, ['info', arguments]);
};

Logger.prototype.warning = function () {
	this._handleLog.apply(this, ['warn', arguments]);
};

// alias of warning
Logger.prototype.warn = function () {
	this._handleLog.apply(this, ['warn', arguments]);
};

Logger.prototype.error = function () {
	this._handleLog.apply(this, ['error', arguments]);
};

Logger.prototype.fatal = function () {
	this._handleLog.apply(this, ['fatal', arguments]);
};

Logger.prototype._handleLog = function (levelName, message) {
	// if there is no config
	if (!this.config || !Object.keys(this.config).length || !this.config.level) {
		// no configurations for log module at all -> fall back to console
		if (levelName === 'error' || levelName === 'fatal') {
			console.error.apply(console, message);
		}
		return;
	}
	// check enabled or not
	if (!this.config.level[levelName]) {
		// not enabled
		return;
	}

	var logMsg = msg.create(this.prefix, this.name, levelName, message);
	
	// if console is enabled, we output to console
	if (this.config.console) {
		if (levelName === 'error') {
			console.error(logMsg.message);
		} else {
			console.log(logMsg.message);
		}
	}

	// add log message to buffer. buffer will flush overflowed log message
	var bufferedMsg = buff.add(levelName, logMsg);
	if (bufferedMsg) {
		// this log level is enabled and there is flushed out log data
		this._outputLog(levelName, bufferedMsg);
	}
};

Logger.prototype._outputLog = function (levelName, bufferedMsg) {
	if (this.config.file) {
		file.log(levelName, bufferedMsg.messages.join('\n'));
	}
	if (this.config.remote) {
		remote.log(levelName, bufferedMsg.messages.join('\n'));
	}
	events.emit('output', address, this.name, levelName, bufferedMsg);
};

Logger.prototype._autoFlush = function (cb) {
	// if there is no config -> we output nothing
	if (!this.config || !this.config.level) {
		return cb();
	}
	var that = this;
	var flushed = buff.flushAll();
	var list = Object.keys(flushed);
	async.each(list, function (level, callback) {
		// check enabled or not
		if (!that.config.level[level]) {
			// not enabled
			return callback();
		}
		if (!flushed[level]) {
			return callback();
		}
		var data = flushed[level];
		var fileLog = function (next) {
			if (that.config.file) {
				return file.log(level, data.messages.join('\n'), next);
			}
			next();
		};
		var remoteLog = function (next) {
			if (that.config.remote) {
				return remote.log(level, data.messages.join('\n'), next);
			}
			next();
		};
		events.emit('output', address, that.name, level, data);
		async.series([fileLog, remoteLog], callback);
	}, cb);
};

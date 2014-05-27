var gracenode;
var ip = require('./lib/ip');
var msg = require('./lib/msg');
var file = require('./lib/file');
var remote = require('./lib/remote');
var buff = require('./buffer');
var EventEmitter = require('events').EventEmitter;
var events = new EventEmitter();
var address = null;
var autoFlushInterval = 5000;

module.exports.setup = function (gn, config) {
	ip.setup();
	address = ip.get();
	msg.setup(config);
	file.setup(gn, config.level, config.file);
	remote.setup(config.remote);
	buff.setup(config.bufferSize);
	gracenode = gn;
	if (config && config.bufferFlushInterval) {
		autoFlushInterval = config.buggerFlushInterval;
	}
};

module.exports.Logger = Logger;

module.exports.events = events;

function Logger(prefix, name, config) {
	this.prefix = prefix;
	this.name = name;
	this.config = config || {};
	var that = this;
	if (gracenode) {
		gracenode.on('exit', function () {
			var flushed = buff.flushAll();
			for (var level in flushed) {
				that._outputLog(level, flushed[level]);
			}
		});
	}
	// auto flush buffered log data at x miliseconds
	setTimeout(function () {
		var flushed = buff.flushAll();
		for (var level in flushed) {
			// if there is no config -> we output nothing
			if (!that.config || !that.config.level) {
				continue;
			}
			// check enabled or not
			if (!that.config.level[level]) {
				// not enabled
				continue;
			}
			that._outputLog(level, flushed[level]);
		}
	}, autoFlushInterval);
}

Logger.prototype.verbose = function () {
	this._handleLog('verbose', arguments);
};

Logger.prototype.debug = function () {
	this._handleLog('debug', arguments);
};

Logger.prototype.info = function () {
	this._handleLog('info', arguments);
};

Logger.prototype.warning = function () {
	this._handleLog('warning', arguments);
};

Logger.prototype.error = function () {
	this._handleLog('error', arguments);
};

Logger.prototype.fatal = function () {
	this._handleLog('fatal', arguments);
};

Logger.prototype._handleLog = function (levelName, message) {
	// if there is no config -> we output nothing
	if (!this.config || !this.config.level) {
		return;
	}
	// check enabled or not
	if (!this.config.level[levelName]) {
		// not enabled
		return;
	}

	var logMsg = msg.create(this.prefix, this.name, levelName, message);

	// add log message to buffer. buffer will flush overflowed log message
	var bufferedMsg = buff.add(levelName, logMsg);
	
	if (bufferedMsg) {
		// this log level is enabled and there is flushed out log data
		this._outputLog(levelName, bufferedMsg);
	}
};

Logger.prototype._outputLog = function (levelName, bufferedMsg) {

	// if console is enabled, we output to console
	if (this.config.console) {	
		console.log(bufferedMsg.message);
	}

	if (this.config.file) {
		file.log(levelName, bufferedMsg);
	}

	if (this.config.remote) {
		remote.log(levelName, bufferedMsg);
	}
	
	events.emit('output', address, this.name, levelName, bufferedMsg);
};

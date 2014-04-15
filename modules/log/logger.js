var ip = require('./lib/ip');
var msg = require('./lib/msg');
var file = require('./lib/file');
var remote = require('./lib/remote');
var EventEmitter = require('events').EventEmitter;
var events = new EventEmitter();
var address = null;

module.exports.setup = function (gn, config) {
	ip.setup();
	address = ip.get();
	msg.setup(config);
	file.setup(gn, config.level, config.file);
	remote.setup(config.remote);
};

module.exports.Logger = Logger;

module.exports.events = events;

function Logger(prefix, name, config) {
	this.prefix = prefix;
	this.name = name;
	this.config = config || {};
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
	// check enabled or not
	if (this.config && this.config.level && !this.config.level[levelName]) {
		// not enabled
		return;
	}

	var logMsg = msg.create(this.prefix, this.name, levelName, message);

	// if console is enabled, we output to console
	if (this.config.console) {	
		console.log('[timestamp:' + logMsg.timestamp + '] ' + logMsg.message);
	}

	// this log level is enabled
	outputLog(this.config, this.name, levelName, logMsg);
};

function outputLog(config, name, levelName, logMsg) {
	
	if (config.file) {
		file.log(levelName, logMsg);
	}

	if (config.remote) {
		remote.log(levelName, logMsg);
	}
	
	events.emit('output', address, name, levelName, logMsg);

	return true;
}

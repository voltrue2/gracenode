var msg = require('./lib/msg');
var file = require('./lib/file');
var remote = require('./lib/remote');

module.exports.setup = function (gn, config) {
	msg.setup(config);
	file.setup(gn, config.level);
	remote.setup(config.remoteServer);
};

module.exports.Logger = Logger;

function Logger(prefix, name, config) {
	this.prefix = prefix;
	this.name = name;
	this.config = config;
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
	var logMsg = msg.create(this.prefix, this.name, levelName, message);
	console.log(logMsg);
	if (this.config && this.config.level && this.config.level[levelName] && this.config.level[levelName].enabled) {
		outputLog(this.config, levelName, logMsg);
	}
};

function outputLog(config, levelName, logMsg) {
	switch (config.type) {
		case 'file':
			file.log(levelName, logMsg);
			break;
		case 'remote':
			remote.send(levelName, logMsg);
			break;
		case 'stdout':
			console.log(logMsg);
			break;
		default:
			console.error('log.logger: Error: unkown type given:', config.type, levelName, logMsg);
			break;
	}
	return true;
}

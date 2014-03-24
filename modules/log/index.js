
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
var os = require('os');
var ip = null;
var dgram = require('dgram');
var config = null;
var prefix = '';

var async = require('async');
var fs = require('fs');

var openFiles = {};

module.exports.readConfig = function (configIn) {
	if (!configIn || !configIn.type) {
		throw new Error('invalid configurations:\n' + JSON.stringify(configIn, null, 4));
	}
	config = configIn;
	
	// server IP addrss
	var ifaces = os.networkInterfaces();
	for (var dev in ifaces) {
		var iface = ifaces[dev];
		for (var i = 0, len = iface.length; i < len; i++) {
			var detail = iface[i];
			if (detail.family === 'IPv4') {
				ip = detail.address;
				break;	
			}
		}
	}
	return true;
};

module.exports.setup = function (cb) {
	if (config.type === 'file' && config.level) {
		// create file write streams
		var options = {
			flags: 'a',
			mode: parseInt('0644', 8),
			encoding: 'utf8'
		};
		var createStream = function (lvl, path, callback) {
			fs.writeFile(path, '', options, function (error) {
				if (error) {
					return callback(error);
				}
				var fileStream = fs.createWriteStream(path, options);
				fs.watch(path, function (event) {
					if (event === 'rename') {
						// the log file has been renamed > end the current write stream
						fileStream.end();
						delete openFiles[lvl];
						// create the new write stream
						createStream(lvl, path, function (error) { console.error('ERROR:', error); });
					}
				});
				// add to open file stream list
				openFiles[lvl] = fileStream;
				// done
				callback();
			});
		};
		var cleaner = function () {
			// cleaner
			module.exports.gracenode._cleanLog('log', function (done) {
				for (var lvlName in openFiles) {
					openFiles[lvlName].end();
					delete openFiles[lvlName];
				}
				done();
			});
			// we are done
			cb();
		};
		var lvlList = Object.keys(config.level);
		async.eachSeries(lvlList, function (lvlName, next) {
			var level = config.level[lvlName];
			if (level.enabled && level.path) {
				var path = level.path + lvlName + '.log';
				createStream(lvlName, path, next);
			}
		}, cleaner);
		return;
	}
	// we do nothing
	cb();
};

module.exports.setPrefix = function (prefixIn) {
	prefix = prefixIn;
};

module.exports.create = function (name) {
	return new Log(prefix, name);
};

function Log(prefix, name) {
	this._name = (prefix ? '(' + prefix + ')' : '') + '[' + name + ']';
}

Log.prototype.verbose = function () {
	var name = 'verbose';
	if (!isEnabled(name)) {
		return;
	}
	var msg = createMsg(this._name, name, arguments);
	print(name, msg);
};

Log.prototype.debug = function () {
	var name = 'debug';
	if (!isEnabled(name)) {
		return;
	}
	var msg = createMsg(this._name, name, arguments);
	print(name, msg);
};

Log.prototype.info = function () {
	var name = 'info';
	if (!isEnabled(name)) {
		return;
	}
	var msg = createMsg(this._name, name, arguments);
	print(name, msg);
};

Log.prototype.warning = function () {
	var name = 'warning';
	if (!isEnabled(name)) {
		return;
	}
	var msg = createMsg(this._name, name, arguments);
	print(name, msg);
};

Log.prototype.error = function () {
	var name = 'error';
	if (!isEnabled(name)) {
		return;
	}
	var msg = createMsg(this._name, name, arguments);
	print(name, msg);
};

Log.prototype.fatal = function () {
	var name = 'fatal';
	if (!isEnabled(name)) {
		return;
	}
	var msg = createMsg(this._name, name, arguments);
	print(name, msg);
};

function isEnabled(name) {
	if (config && config.level && config.level[name] && config.level[name].enabled) {
		return true;
	}
	return false;
}

function createMsg(logName, name, args) {
	var date = new Date();
	var ymd = date.getFullYear() + '/' + pad(date.getMonth() + 1, 2) + '/' + pad(date.getDate(), 2);
	var his = pad(date.getHours(), 2) + ':' + pad(date.getMinutes(), 2) + ':' + pad(date.getSeconds(), 2) + ':' + pad(date.getMilliseconds(), 3); 
	var timestamp = ymd + ' ' + his;
	var space = '';
	for (var i = 0, len = timestamp.length; i < len; i++) {
		space += ' ';
	}
	var msg = [color(name, '[' + timestamp + '] <' + name + '> ' + logName)];
	for (var key in args) {
		msg.push(color(name, args[key], space));
	}
	return msg;
}

function pad(n, digit) {
	n = n.toString();
	var len = n.length;
	if (len < digit) {
		var diff = digit - len;
		var padding = '';
		while (diff) {
			padding += '0';
			diff--;
		}
		n = padding + n;
	}
	return n;
}

function print(name, msg) {
	if (config && config.level && config.level[name] && config.level[name].path) {
		switch (config.type) {
			case 'file':
				// we log to a file
				writeToFile(name, msg);
				break;
			case 'remote':
				// we send log data to a remote server via UDP4
				sendToServer(name, msg);
				break;
		}
	}
	// we log to stdout stream
	console.log.apply(console, msg);
}

function writeToFile(name, msg) {
	if (openFiles[name]) {
		openFiles[name].write(msg.join(' ') + '\n');
	}
}

function sendToServer(name, msg) {
	var data = {
		address: ip,
		name: name,
		message: msg
	};
	data = new Buffer(JSON.stringify(data));
	// set up UDP sender
	var client = dgram.createSocket('udp4');
	var offset = 0;
	// check config
	if (!config.remoteServer || !config.remoteServer.port || !config.remoteServer.host) {
		console.error('Error: missing remoteServer configurations');
		console.error(config.remoteServer);
		return;
	}
	// send
	console.log('seding log data to:', config.remoteServer);
	client.send(data, offset, data.length, config.remoteServer.port, config.remoteServer.host, function (error) {
		if (error) {
			console.error(error);
		}
		
		// close socket
		client.close();
	});
}

function color(name, msgItem) {
	var res = '';
	if (typeof msgItem === 'object') {
		if (msgItem instanceof Error) {
			msgItem = msgItem.message + '\n<stack trace>\n' + msgItem.stack;
		} else {
			try {
				msgItem = '\n' + JSON.stringify(msgItem, null, 4);
			} catch (e) {
				msgItem = '[Circular]';
			}
		}
	}
	if (!config || !config.color) {
		// no colors used
		return msgItem;
	}
	// log with colors
	switch (name) {
		case 'verbose':
			res = '\033[0;37m' + msgItem + '\033[0m';
			break;
		case 'debug':
			res = '\033[1;34m' + msgItem + '\033[0m';
			break;
		case 'info':
			res = '\033[0;32m' + msgItem + '\033[0m';
			break;
		case 'warning':
			res = '\033[1;35m' + msgItem + '\033[0m';
			break;
		case 'error':
			res = '\033[1;31m' + msgItem + '\033[0m';
			break;
		case 'fatal':
			res = '\033[1;37m\033[41m' + msgItem + '\033[0m';
			break;
		default:
			res = msgItem;
			break;
	}
	return res;
}


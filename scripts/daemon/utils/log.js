var fs = require('fs');
var options = {
	flags: 'a',
	mode: parseInt('0644', 8),
	encoding: 'utf8'
};

module.exports = Log;

function Log(path) {
	this._path = path;
	this._stream;
	this._name;
}

Log.prototype.today = function () {
	var date = new Date();
	return date.getFullYear() + '.' + pad(date.getMonth() + 1) + '.' + pad(date.getDate());
};

Log.prototype.time = function () {
	var date = new Date();
	return '[' + date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds()) + ']';
};

Log.prototype.start = function (name, cb) {
	if (this._stream || !this._path) {
		return;
	}
	this._name = name;
	var path = this._path + 'gracenode-daemon.' + this.today() + '.log';
	this._stream = fs.createWriteStream(path, options);
	if (cb) {
		this._stream.once('open', cb);
	}
};

Log.prototype.stop = function (error, cb) {
	if (!this._stream) {
		if (cb) {
			cb();
		}
		return;
	}
	if (cb) {
		this._stream.once('finish', cb);
	}
	if (error) {
		this.error(error);
	}
	this._stream.end();
	this._stream = null;
};

Log.prototype.restart = function (cb) {
	if (!this._stream) {
		return cb();
	}
	this.stop();
	this.start(this._name, cb);
};

Log.prototype.info = function (msg) {
	if (!this._stream) {
		return;
	}
	this._stream.write(this.time() + '[' + this._name + ']<info> ' + msg + '\n');
};

Log.prototype.error = function (msg) {
	if (!this._stream) {
		return;
	}
	this._stream.write(this.time() + '[' + this._name + ']<error> ' + msg + '\n');
};

function pad(n) {
	if (n < 10) {
		return '0' + n;
	}
	return n;
}

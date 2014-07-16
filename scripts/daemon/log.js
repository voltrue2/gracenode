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
}

Log.prototype.today = function () {
	var date = new Date();
	return date.getFullYear() + '.' + (date.getMonth() + 1) + '.' + date.getDate();
};

Log.prototype.time = function () {
	var date = new Date();
	return '[' + date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ']';
};

Log.prototype.start = function () {
	if (this._stream || !this._path) {
		return;
	}
	var path = this._path + this.today() + '.daemon.log';
	this._stream = fs.createWriteStream(path, options);
};

Log.prototype.stop = function () {
	if (!this._stream) {
		return;
	}
	this._stream.end();
	this._stream = null;
};

Log.prototype.info = function (msg) {
	if (!this._stream) {
		return;
	}
	this._stream.write(this.time() + '<info> ' + msg + '\n');
};

Log.prototype.error = function (msg) {
	if (!this._stream) {
		return;
	}
	this._stream.write(this.time() + '<error> ' + msg + '\n');
};

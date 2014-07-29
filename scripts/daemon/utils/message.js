var gn = require('gracenode');
var fs = require('fs');
var prefix = '/tmp/gracenode-message-';
var options = {
	flags: 'a',
	mode: parseInt('0644', 8),
	encoding: 'utf8'
};

module.exports = Message;

function Message(appPath) {
	this._appPath = appPath;
	this._name = prefix + this._appPath.replace(/\//g, '-') + '.msg';
	this._stream = null;
	// set up cleaning on process exit
	var that = this;
	process.on('exit', function () {
		that.stop();
	});
}

Message.prototype.startSend = function () {
	if (this._stream) {
		return;
	}
	this._stream = fs.createWriteStream(this._name, options);
};

Message.prototype.read = function (cb) {
	if (this._stream) {
		return;
	}
	var that = this;
	// make sure the message file is created
	var stream = fs.createWriteStream(this._name, options);
	stream.end();
	// now listen for file change
	process.nextTick(function () {
		that._stream = fs.watch(that._name, function (event) {
			if (event !== 'change') {
				return;
			}
			fs.readFile(that._name, function (error, data) {
				if (error) {
					// hmmm
				}
				var msg = JSON.parse(data.toString());
				cb(msg);
				that._stream.close();
			});
		});
	});
};

Message.prototype.send = function (msg) {
	if (this._stream) {
		this._stream.write(JSON.stringify({ app: this._appPath, msg: msg }));
		this._stream.end();
	}
};

Message.prototype.stop = function () {
	if (this._stream) {
		this._stream = null;
		fs.unlinkSync(this._name);	
	}
};

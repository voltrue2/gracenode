
var EventEmitter = require('events').EventEmitter;
var util = require('util');

module.exports.create = function () {
	return new Message();
};

function Message() {
	EventEmitter.call(this);
	this._pending = [];
}

util.inherits(Message, EventEmitter);

Message.prototype.wait = function (data) {
	var msgData = { data: data };
	this._pending.push(msgData);
	this.emit('wait', msgData);
};

Message.prototype.send = function (data) {
	while (this._pending.length) {
		var pendingData = this._pending.shift();
		if (pendingData) {
			this.emit('send', pendingData, data);
		}
	}
};


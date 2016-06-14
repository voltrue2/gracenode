'use strict';

var gn = require('../../src/gracenode/');
var CryptoEngine = require('../../lib/packet/cryptoengine');
var dgram = require('dgram');

function UdpClient(serverAddr, serverPort) {
	this._serverAddr = serverAddr;
	this._serverPort = serverPort;
	this._client = dgram.createSocket('udp4');
	this._ce = null;
	this._sid = null;
	this._cipher = null;
	var that = this;
	this._client.on('message', function (buf) {
		that._handleMessage(buf);
	});
}

UdpClient.prototype.secure = function (sid, cipher) {
	this._sid = sid;
	this._cipher = cipher;
	this._ce = new CryptoEngine();
	this._recv = [];
};

UdpClient.prototype.send = function (msg, cb) {
	if (this._sid && this._cipher) {
		var uuid = gn.lib.uuid.create(this._sid);
		var sbuf = new Buffer(16 + 4);
		var seq = this._cipher.seq += 1;
		uuid.toBytes().copy(sbuf, 0, 0, uuid.getByteLength());
		sbuf.writeUInt32BE(this._cipher.seq, 16);
		var emsg = this._ce.encrypt(
			this._cipher.cipherKey,
			this._cipher.cipherNonce,
			this._cipher.macKey,
			seq,
			new Buffer(JSON.stringify(msg))
		);
		msg = Buffer.concat([ sbuf, emsg ]);
	} else {
		msg = new Buffer(JSON.stringify(msg));
	}
        this._client.send(msg, 0, msg.length, this._serverPort, this._serverAddr, cb);
};

UdpClient.prototype.receiveOnce = function (handler) {
	this._recv.push(handler);
};

UdpClient.prototype._handleMessage = function (buf) {
	var msg;
	var handler = this._recv.shift();
	if (!handler) {
		return;
	}
	if (this._sid && this._cipher) {
		var decrypted = this._ce.decrypt(
			this._cipher.cipherKey,
			this._cipher.cipherNonce,
			this._cipher.macKey,
			this._cipher.seq,
			buf
		);
		msg = JSON.parse(decrypted.toString());
	} else {
		msg = JSON.parse(buf.toString());
	}
	handler(msg);
};

module.exports = UdpClient;

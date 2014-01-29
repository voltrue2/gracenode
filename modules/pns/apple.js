
var gracenode = require('../..');
var log = gracenode.log.create('pns-apple');

var tls = require('tls');
var fs = require('fs');
var async = require('async');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var urlDef = { 
	'sandbox': 'ssl://gateway.sandbox.push.apple.com', 
	'live': 'ssl://gateway.push.apple.com' 
};
var tokenSize = 32;
var port = 2195;
var url = null;
var config = null;
var certPaths = null;
var certs = { 
	certPem: null,
	keyPem: null,
	cert: null
};
var url = null;

/*
pns: {
	sandbox: true/false,
	apple: {
		sandbox: {
			certPem: 'file path',
			keyPem: 'file path',
			ca: 'file path'
		},
		live: {
			certPem: 'file path',
			keyPem: 'file path',
			ca: 'file path'
		}
	},
	google: {

	}
}
*/
module.exports.readConfig = function (configIn) {
	
	if (!configIn.apple) {
		log.info('apple is not available...');
		return;
	}
	
	config = configIn.apple;
};

module.exports.setup = function (mode, cb) {
	if (!config) {
		return cb();
	}
	/*
	certPaths = {
		certPem: 'path to cert pem file',
		keyPem: 'path to key pem file',
		ca: 'path to cert file'
	}
	*/
	url = urlDef[mode] || null;
	certPaths = config[mode] || null;
	
	if (!certPaths) {
		return cb(new Error('certificate paths are missing for "' + mode + '" mode'));
	}
	
	log.verbose('certificate paths:', certPaths);
	
	readCertificates(cb);
};

module.exports.connect = function (cb) {
	if (!config) {
		log.warning('apple is not available');
		return cb();
	}
	var params = {
		key: certs.keyPem,
		cert: certs.certPem,
		ca: certs.ca
	};
	log.info('connecting to apple:', port, url, params);
	var stream = tls.connect(port, url, params, function (error) {
		if (error) {
			return cb(error);
		}
		if (!stream.authorized) {
			return cb(new Error('auth failed'));
		}
		
		log.info('connected to apple');

		cb(null, new PNS(stream));
	});
};

function PNS(stream) {
	this._stream = null;
	this._sentMsg = {};	
	
	this.connect(stream);
}

util.inherits(PNS, EventEmitter);

PNS.prototype.connect = function (stream) {
	this._stream = stream;
	// set up data handler (this includes error response from apple)
	this._stream.on('data', this.handleResponse);
	// set up connection error listener
	this._stream.on('error', this.handleError);
	// set up connection close handler
	this._stream.on('end', this.handleConnectionEnd);
};

/*
data: {
	aps: {
		"title string": "message string"
	}
}
expire = in seconds
*/
PNS.prototype.send = function (hexToken, expire, data) {
	var binToken = convertHexToBin(hexToken);
	var payload = JSON.stringify(data);
	var payloadSize = Buffer.byteLength(payload, 'utf-8');
	// create the message buffer to be sent
	var i = 0;
	var buffer = new Buffer(1 + 4 + 4 + 2 + tokenSize + 2 + payloadSize);
	// message ID
	var msgId = 0xbeefcace;
	buffer[i++] = msgId >> 24 & 0xff;
	buffer[i++] = msgId >> 16 & 0xff;
	buffer[i++] = msgId >> 8 & 0xff;
	buffer[i++] = msgId > 0xff;
	// expiry
	var time = Math.round(Date.now() / 1000) + expire;
	buffer[i++] = time >> 24 & 0xff;	
	buffer[i++] = time >> 16 & 0xff;	
	buffer[i++] = time >> 8 & 0xff;	
	buffer[i++] = time > 0xff;
	// token size
	buffer[i++] = tokenSize >> 8 & 0xff;
	buffer[i++] = tokenSize & 0xff;
	// token
	binToken.copy(buffer, i, 0, tokenSize);
	i += tokenSize;
	// payload size
	buffer[i++] = payloadSize >> 8 & 0xff;
	buffer[i++] = payloadSize & 0xff;
	// payload
	payload = new Buffer(payload);
	payload.copy(buffer, i, 0, payloadSize);
	
	// now send it off to apple
	this._stream.write(buffer);	
	
	// remember sent message
	this._sentMsg[msgId] = { data: buffer, token: hexToken };
	
	log.verbose('aps sent: ', hexToken, expire, data);
};

// meant to be used privatly only
// TODO: need to come up with a solution when data is smaller than 6bytes...
PNS.prototype.handleResponse = function (data) {
	// always 8. this is apple's rule
	var command = data[0] & 0x0ff;
	// error code
	var errorCode = data[1] & 0x0ff;
	// msg id
	var msgId = (data[2] << 24) + (data[3] << 16) + (data[4] << 8) + (data[5]);
	// emit
	this.emit('error', msgId, command, errorCode);
	
};

PNS.prototype.handleError = function (error) {
	this.emit('error', error);
};

PNS.prototype.handleConnectionEnd = function () {
	this.emit('end');
};

PNS.prototype.resend = function (msgId) {
	var msg = this._sentMsg[msgId] || null;
	if (!msg) {
		return false;
	}
	this._stream.write(msg.data);
	
	log.verbose('resend:', msg.token);

	return true;
};

PNS.prototype.discard = function (msgId) {
	if (this._sentMsg[msgId] === undefined) {
		return false;
	}
	delete this._sentMsg[msgId];
	return true;
};

function readCertificates(cb) {
	var list = [];
	for (var key in certPaths) {
		list.push({ name: key, path: certPaths[key] });
	}
	async.forEach(list, function (item, callback) {
		fs.readFile(item.path, 'ascii', function (error, data) {
			if (error) {
				return cb(error);
			}
			certs[item.name] = data;
			callback();
		});
	}, cb);
}

function convertHexToBin(hexStr) {
	var hexLen = hexStr.length;
	var buffer = new Buffer(hexLen / 2);
	for (var i = 0, len = hexLen / 2; i < len; i++) {
		var pos = i * 2;
		buffer[i] = (parseInt(hexStr[pos], 16) << 4) + (parseInt(hexStr[pos + 1], 16));
	}
	return buffer;
}

'use strict';

var name = 'meshnet/network-node';
var uuid = require('node-uuid');
var dgram = require('dgram');
var crypto = require('crypto');
var os = require('os');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var DEFAULTS = {
	address: '0.0.0.0',
	port: 12345,
	broadcast: '255.255.255.255',
	encryptionKey: null
};

var CIPHER = 'aes256';

var hostName = os.hostname();
var config;
var logger;
var gn;

// we do NOT support multicast

// called from mesh-net/lib/discover
module.exports.setGracenode = function (gnIn) {
	gn = gnIn;
	logger = gn.log.create(name);
};

// called from mesh-net/lib/discover
module.exports.setup = function (configIn) {
	
	config = DEFAULTS;

	for (var key in configIn) {
		config[key] = configIn[key];
	}

	logger.verbose('configurations:', config);
};

// called from mesh-net/lib/discover
module.exports.NetworkNode = NetworkNode;

function NetworkNode() {
	EventEmitter.call(this);
	var that = this;
	this.id = uuid.v4();
	this.socket = dgram.createSocket('udp4');
	this.socket.on('message', function (data, info) {
		that.handleMsg(data, info);
	});
	this.socket.on('error', function (error) {
		that.handleError(error);
	});
}

util.inherits(NetworkNode, EventEmitter);

NetworkNode.prototype.start = function (cb) {
	var that = this;
	try {
		this.socket.bind(config.port, config.address, function () {
			that.socket.setBroadcast(true);
				
			logger.info(
				'network node [id:' + that.id + '] started at:', 
				config.address + ':' + config.port
			);
			
			cb();
		});
	} catch (error) {
		cb(error);
	}
};

NetworkNode.prototype.stop = function (cb) {
	this.socket.close();

	logger.info(
		'network node [id:' + this.id + '] stopped at:', 
		config.address, 
		config.port
	);

	cb();
};

NetworkNode.prototype.send = function (eventName, data) {
	var obj = {
		eventName: eventName || null,
		id: this.id,
		hostName: hostName,
		data: data || null
	};
	var encodedData = encode(obj);
	
	if (!encodedData) {
		logger.error('failed to send:', obj);
		return false;
	}

	var msg = new Buffer(encodedData);
	this.socket.send(msg, 0, msg.length, config.port, config.broadcast);
		
	logger.verbose('broadcast sent to [' + config.broadcast + ':' + config.port + ']:', obj);
	
	return true;
};

NetworkNode.prototype.handleMsg = function (msg, info) {
	var decodedData = decode(msg);
	
	if (!decodedData) {
		logger.error('failed to handle message:', msg, info);
	}

	if (decodedData.id === this.id) {
		// the message comes from the same networkNode instance, ignore that...
		return;
	}

	if (decodedData.eventName) {
		// the message is a specific event
		return this.emit(decodedData.eventName, decodedData.data, decodedData, info);
	}

	// the message is a generic message
	this.emit('message', decodedData);
};

NetworkNode.prototype.handleError = function (error) {
	logger.error('error occured while receiving a message:', error);
};

function encode(data) {
	var str;
	try {
		str = JSON.stringify(data);
	} catch (error) {
		logger.error('failed to encode message data:', data, error);
		return null;
	}
	if (config.encryptionKey) {
		return encrypt(str, config.encryptionKey);
	}
	return str;
}

function decode(data) {
	if (config.encryptionKey) {
		data = decrypt(data.toString(), config.encryptionKey);
	}
	try {
		return JSON.parse(data);
	} catch (error) {
		logger.error('failed to decode message data:', data, error);
		return null;
	}
}

function encrypt(key, data) {
	var buffer = [];
	var cipher = crypto.createCipher(CIPHER, key);
	buffer.push(cipher.update(data, 'utf8', 'binary'));
	buffer.push(cipher.final('binary'));
	return buffer.join('');
}

function decrypt(key, data) {
	var buffer = [];
	var decipher = crypto.createDecipher(CIPHER, key);
	buffer.push(decipher.update(data, 'binary', 'utf8'));
	buffer.push(decipher.final('utf8'));
	return buffer.join('');
}

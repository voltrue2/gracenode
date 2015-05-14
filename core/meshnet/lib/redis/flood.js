'use strict';

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var flood = require('floodnet');
var name = 'meshnet/redis';
var gn;
var logger;
var config;

var HELLO = 'hello';
var BYE = 'bye';
var TYPE = 'meshnet';

// called from meshnet/index.js
module.exports.setGracenode = function (gnIn) {
	gn = gnIn;
	logger = gn.log.create(name);
};

// called from meshnet/index.js
module.exports.setup = function (configIn) {
	config = configIn;
	setupListeners();
};

// called from meshnet/index.js
module.exports.MeshNet = MeshNet;

function MeshNet() {
	EventEmitter.call(this);
	this.running = false;
	this.nodes = {};
	this.channels = [];

	var that = this;

	// message from worker processes
	/*
		msg: {
			action: <join|send|leave>
			channel: <channelName>
			data: <dataObject>
		}
	*/
	gn.on('worker.message', function (senderWorker, msg) {
		if (msg.channel) {
			switch (msg.action) {
				case 'join':
					that.join(msg.channel);
					break;
				case 'send':
					that.send(msg.channel, msg.data);
					break;
				case 'leave':
					that.leave(msg.channel);
					break;
				case 'each':
					that.eachNode(senderWorker);
					break;
			}
		}
	});
}

util.inherits(MeshNet, EventEmitter);

// public
MeshNet.prototype.start = function (cb) {

	if (this.running) {
		return cb(new Error('meshnet has already been started'));
	}

	var that = this;

	logger.info('starting mesh network');

	flood.setup(config, function (error) {
		if (error) {
			return cb(error);
		}
		that.running = true;

		logger.info('mesh network started');

		cb();
	});
};

// public
MeshNet.prototype.stop = function (cb) {
	
	if (!this.running) {
		return cb(new Error('meshnet has not started'));
	}

	// leave all channels
	for (var i = 0, len = this.channels.length; i < len; i++) {
		this.leave(this.channels[i]);
	}

	var that = this;

	flood.exit(function (error) {
		if (error) {
			logger.error(error);
		}
		that.running = false;
	
		logger.info('meshnet has stopped');

		cb();
	});
};

// public
MeshNet.prototype.join = function (channelName) {

	if (this.channels.indexOf(channelName) !== -1) {
		logger.verbose('already a member of the channel', channelName);
		return false;
	} 

	var that = this;
	
	flood.subscribe(channelName, function (key, msg) {

		if (msg.data === HELLO || msg.data === BYE) {
			// HELLO means there's a new mesh node
			// BYE means a mesh node has left
			return that.handleHelloOrBye(msg);
		}

		var message = {
			__type__: TYPE,
			channel: channelName,
			data: msg.data,
			obj: msg,
			info: key
		};
		gn.send(message);
	});

	this.channels.push(channelName);

	logger.info('joined a channel:', channelName);

	return true;
};

// public
MeshNet.prototype.leave = function (channelName) {

	if (!channelName) {
		return false;
	}

	var index = this.channels.indexOf(channelName);

	if (index === -1) {
		logger.verbose('not a member of the channel', channelName);
		return false;
	}

	flood.unsubscribe(channelName);

	delete this.channels[index];

	logger.info('left a channel:', channelName);

	return true;
};

// public
MeshNet.prototype.send = function (channelName, obj) {
	
	if (this.channels.indexOf(channelName) === -1) {
		logger.verbose('not a member of the channel', channelName);
		return false;
	}

	logger.verbose('sending message [' + channelName + ']', obj);

	flood.publish(channelName, obj);

	return true;
};

// public
MeshNet.prototype.eachNode = function (worker) {
	var nodes = {};
	for (var id in this.nodes) {
		nodes[id] = gn.lib.cloneObj(this.nodes[id]);
	}
	if (gn.isMaster()) {
		gn.send({ type: TYPE, __nodes__: nodes }, worker);
	}
};

// private
MeshNet.prototype.handleHelloOrBye = function (msg) {
	var nodeId = msg.id;
	
	if (msg.data === HELLO) {
		this.nodes[nodeId] = {
			lastSeen: Date.now(),
			address: null,
			hostName: null,
			port: null,
			id: nodeId
		};
		logger.info('a new node has been added:', nodeId);
		return this.emit('added', this.nodes[nodeId], msg, null);
	}

	delete this.nodes[nodeId];
	logger.info('a node has left [id: ' + nodeId + ']');
	this.emit('removed', nodeId);
};

function setupListeners() {
	flood.on('connect', function (type) {
		logger.info('connected to redis: [' + type + ']');
	});
	flood.on('end', function (type) {
		logger.info('closed connection to redis: [' + type + ']');
	});
	flood.on('error', function (error, type) {
		logger.error('connection to redis failed: [' + type + ']', error);
	});
}

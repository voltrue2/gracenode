'use strict';

var name = 'meshnet/discover';
var network = require('./networkNode');
var NetworkNode = network.NetworkNode;
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var DEFAULTS = {
	helloInterval: 1000,
	checkInterval: 2000,
	nodeTimeout: 2000
};

var RESERVED_EVENTS = [
	'hello',
	'added',
	'removed'
];

var gn;
var logger;
var config;

// called from mesh-net/index.js
module.exports.setGracenode = function (gnIn) {
	gn = gnIn;
	logger = gn.log.create(name);
	network.setGracenode(gn);
};

// called from mesh-net/index.js
module.exports.setup = function (configIn) {

	config = DEFAULTS;	

	for (var key in configIn) {
		config[key] = configIn[key];
	}

	if (config.nodeTimeout < config.checkInterval) {
		throw new Error('nodeTimeout must be greater than or equal to checkInterval');
	}

	logger.verbose('configurations:', config);

	network.setup(configIn);
};

// called from mesh-net/index.js
module.exports.Discover = Discover;

function Discover() {
	EventEmitter.call(this);
	var that = this;
	this.running = false;
	this.broadcast = new NetworkNode();
	this.me = {
		// local host
		address: '127.0.0.1'
	};
	this.nodes = {};
	this.channels = [];

	this.broadcast.on('hello', function (data, obj, info) {
		that.handleHello(data, obj, info);
	});

	this.broadcast.on('error', function (error) {
		that.emit('error', error);
	});

	// message from worker processes
	/*
	msg {
		action: <join|send|leave>
		channel: <channelName>,
		data: data
	}
	*/
	gn.on('worker.message', function (serverWorker, msg) {
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
			}
		}
	});
}

util.inherits(Discover, EventEmitter);

// private
Discover.prototype.handleHello = function (data, obj, info) {
	
	var isNew = false;

	// check if this node has been seen before or not
	if (!this.nodes[data.id]) {
		// never seen node
		isNew = true;
	}
	
	// reset node data to avoid old data remaining
	this.nodes[data.id] = {
		lastSeen: Date.now(),
		address: info.address,
		hostName: obj.hostName,
		port: info.port,
		id: obj.id
	};

	// update node data
	for (var key in data) {
		this.nodes[data.id] = data[key];
	}

	// announce if the new node has been discovered
	if (isNew) {
		logger.info('a new node has been added:', data.id, this.nodes[data.id], obj, info);
		this.emit('added', this.nodes[data.id], obj, info);
	}
	
};

// private
Discover.prototype.sendHello = function () {
	
	if (!this.running) {
		logger.info('stop sending "hello" to other network nodes');
		return;
	}

	var that = this;
	
	logger.verbose('sending "hello" to other network nodes:', that.me);

	that.broadcast.send('hello', that.me);
	
	setTimeout(function () {
		that.sendHello();
	}, config.helloInterval);
};

// private
Discover.prototype.handleCheck = function () {
	
	if (!this.running) {
		logger.info('stop checking network nodes\' availability');
		return;
	}

	var that = this;
	var now = Date.now();	
	
	// check all known nodes and see if any has died or not...
	for (var id in this.nodes) {
		var node = this.nodes[id];
		
		if (now - node.lastSeen > config.nodeTimeout) {
			logger.error('a network node [id:' + id + '] has timed out and now be removed from the known list of', this.broadcast.id);
			delete this.nodes[id];
			this.emit('removed', node);
			continue;
		}

		logger.verbose('a network node [id:' + id + '] is still available to', this.broadcast.id);
	}

	setTimeout(function () {
		that.handleCheck();
	}, config.checkInterval);
};

// private
Discover.prototype.start = function (cb) {
	
	if (this.running) {
		return (new Error('discover has already been started'));
	}

	var that = this;

	logger.info('starting mesh network');

	this.broadcast.start(function (error) {
		if (error) {
			return cb(error);
		}
		that.running = true;
	
		// start checking
		that.handleCheck();

		// start sending hello at config.helloInterval
		that.sendHello();

		logger.info('mesh network started');
	});
};

// private
Discover.prototype.stop = function (cb) {
	this.running = false;
	for (var i = 0, len = this.channels.length; i < len; i++) {
		this.leave(this.channels[i]);
	}
	this.broadcast.stop(function () {
		logger.info('discover has stopped');
		cb();
	});
};

// public
Discover.prototype.join = function (channelName) {
	var that = this;

	if (RESERVED_EVENTS.indexOf(channelName) !== -1) {
		logger.error('channel name is a reserved name', channelName);
		return false;
	}

	if (this.channels.indexOf(channelName) !== -1) {
		logger.warn('already a member of the channel', channelName);
		return;
	}

	this.broadcast.on(channelName, function (data, obj, info) {
		that.emit(channelName, data, obj, info);
		
		if (gn.isMaster()) {
			// send message to worker processes
			var msg = {
				channel: channelName,
				data: data,
				obj: obj,
				info: info
			};
			gn.send(msg);
		}

	});
	
	this.channels.push(channelName);

	logger.info('joined a channel:', channelName, this.broadcast.id);

	return true;
};

// public
Discover.prototype.leave = function (channelName) {
	var index = this.channels.indexOf(channelName);
	
	if (index === -1) {
		logger.warn('not a member of a channel', channelName);
		return false;
	}

	this.broadcast.removeAllListeners(channelName);
	delete this.channels[index];

	logger.info('left a channel:', channelName, this.broadcast.id);

	return true;
};

// public
Discover.prototype.send = function (channelName, obj) {
	
	if (RESERVED_EVENTS.indexOf(channelName) !== -1) {
		logger.error('cannot send a message to channel name that is reserved', channelName, this.broadcast.id);
		return false;
	}

	logger.verbose('sending message [' + channelName + ']', this.broadcast.id, obj);

	this.broadcast.send(channelName, obj);

	return true;
};

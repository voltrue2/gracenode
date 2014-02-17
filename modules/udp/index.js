
var gracenode = require('../../');
var log = gracenode.log.create('updserver');
var dgram = require('dgram');
var async = require('async');

var config = null;

var servers = {};

/*
* configurations
* servers:  { name: "server unique name", port: port number, host: 'host name or ip' }, { name: "server unique name", port: port number, host: 'host name or ip' }... ]
* requests: { "unique name": { host: 'host name', port: port number }... }
*/
module.exports.readConfig = function (configIn) {
	if (!configIn) {
		return new Error('no configurations given');
	}
	config = configIn;
};

module.exports.startServers = function (cb) {
	
	var servers = config.servers || null;
	if (!servers) {
		return cb(new Error('no server configurations'));
	}

	log.verbose('start UDP server(s)...');

	async.eachSeries(servers, function (item, nextCallback) {
		setupServer(item, nextCallback);
	}, cb);
};

module.exports.getServerByName = function (name) {
	if (servers[name]) {
		return servers[name];
	}
	return null;
};

/*
* options: { offset: int }
*/
module.exports.send = function (reqName, msg, options, cb) {
	
	var profiler = gracenode.profiler.create('udp-sender');
	profiler.start();

	// check the data type of msg
	msg = prepareData(msg);
	// request data from config
	var clientInfo = config.requests && config.requests[reqName];
	if (!clientInfo) {
		return cb(new Error('no request configuration for "' + reqName + '"\n' + JSON.stringify(config.requests)));
	}
	// set up UDP sender
	var client = dgram.createSocket('udp4');
	var offset = (options && options.offset) ? options.offset : 0;
	// send
	client.send(msg, offset, msg.length, clientInfo.port, clientInfo.host, function (error, bytes) {
		if (error) {
			return cb(error);
		}	
		cb(null, bytes);
		// close socket
		client.close();		

		profiler.stop();
	});
};
 
function setupServer(serverInfo, cb) {
	
	log.verbose('setting up UPD server: ', serverInfo);

	// the server will be listening to PI4
	var server = dgram.createSocket('udp4');
	
	// the application will be listening on this "message" event to handle the requests
	server.on('message', function (msg, req) {
		log.verbose('request recieved from: ' + req.address + ':' + req.port);
	});

	// events
	server.on('error', function (error) {
		log.error(error);
	});

	server.on('close', function () {
		log.info('socket closed: ' + serverInfo);
	});
	
	// listen to requests
	server.on('listening', function () {
		var address = this.address();
		log.info('UPD server started: now listening to ' + address.address + ':' + address.port);
		cb();
	});

	// bind the server to port
	server.bind(serverInfo.port, serverInfo.host);

	// map
	servers[serverInfo.name] = server;
}

function prepareData(msg) {
	switch (typeof msg) {
		case 'string':
			return new Buffer(msg);
		case 'object':
			return new Buffer(JSON.stringify(msg));
		case 'number':
			return new Buffer(msg.toString());
		default:
			log.error('data type MUST be either "String" or "Object/Array"');
			return null;
	}
}

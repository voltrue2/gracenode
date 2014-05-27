var dgram = require('dgram');

var ip = require('./ip');

var address = null;
var config = null;

module.exports.setup = function (configIn) {
	
	if (!configIn) {
		// no remote logging
		return;
	}

	address = ip.get();
	config = configIn;
};

// cb is optional for auto buffer flushing
module.exports.log = function (levelName, msg, cb) {
	// check config
	if (!config || !config.port || !config.host) {
		console.error('Error: missing remoteServer configurations');
		console.error(config);
		return;
	}
	var data = {
		address: address,
		name: levelName,
		message: msg.message,
		timestamp: msg.timestamp
	};
	data = new Buffer(JSON.stringify(data));
	// set up UDP sender
	var client = dgram.createSocket('udp4');
	var offset = 0;
	// send
	client.send(data, offset, data.length, config.port, config.host, function (error) {
		if (error) {
			console.error(error);
		}
		
		// close socket
		client.close();
		if (cb) {
			cb();
		}
	});
};

var os = require('os');
var dgram = require('dgram');

var ip = null;
var config = null;

module.exports.setup = function (configIn) {
	// server IP addrss
	var ifaces = os.networkInterfaces();
	for (var dev in ifaces) {
		var iface = ifaces[dev];
		for (var i = 0, len = iface.length; i < len; i++) {
			var detail = iface[i];
			if (detail.family === 'IPv4') {
				ip = detail.address;
				break;
			}
		}
	}
	config = configIn;
};

module.exports.send = function (levelName, msg) {
	var data = {
		address: ip,
		name: levelName,
		message: msg
	};
	data = new Buffer(JSON.stringify(data));
	// set up UDP sender
	var client = dgram.createSocket('udp4');
	var offset = 0;
	// check config
	if (!config || !config.port || !config.host) {
		console.error('Error: missing remoteServer configurations');
		console.error(config);
		return;
	}
	// send
	client.send(data, offset, data.length, config.port, config.host, function (error) {
		if (error) {
			console.error(error);
		}
		
		// close socket
		client.close();
	});
};

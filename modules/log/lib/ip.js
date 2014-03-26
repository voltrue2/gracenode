var os = require('os');

var ip = null;

module.exports.setup = function () {
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
};

module.exports.get = function () {
	return ip;
};

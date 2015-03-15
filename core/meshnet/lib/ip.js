var os = require('os');

var ip = null;

module.exports.setup = function () {
	// server IP addrss
	var ifaces = os.networkInterfaces();
	for (var dev in ifaces) {
		var iface = ifaces[dev];
		for (var i = 0, len = iface.length; i < len; i++) {
			var detail = iface[i];
			// we ignore non-IPv4 and internal
			// even if the server has more than 1 interface, we pick the first match and stop
			if (detail.family === 'IPv4' && !detail.internal) {
				ip = detail.address;
				break;
			}
		}
	}
};

module.exports.get = function () {
	return ip;
};

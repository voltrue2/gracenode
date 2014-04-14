var config = null;

module.exports.setup = function (configIn) {
	config = configIn;
};

module.exports.create = function (name, msgItem) {
	var res = '';
	// no color used
	if (!config || !config.color) {
		return msgItem;
	}
	// log with colors
	switch (name) {
		case 'verbose':
			res = '\033[0;37m' + msgItem + '\033[0m';
			break;
		case 'debug':
			res = '\033[1;34m' + msgItem + '\033[0m';
			break;
		case 'info':
			res = '\033[0;32m' + msgItem + '\033[0m';
			break;
		case 'warning':
			res = '\033[1;35m' + msgItem + '\033[0m';
			break;
		case 'error':
			res = '\033[1;31m' + msgItem + '\033[0m';
			break;
		case 'fatal':
			res = '\033[1;37m\033[41m' + msgItem + '\033[0m';
			break;
		default:
			res = msgItem;
			break;
	}
	return res;
};


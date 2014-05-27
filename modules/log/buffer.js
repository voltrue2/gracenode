var buff = {
	'verbose': {
		data: [],
		size: 0
	},
	'debug': {
		data: [],
		size: 0
	},
	'info': {
		data: [],
		size: 0
	},
	'warning': {
		data: [],
		size: 0
	},
	'error': {
		data: [],
		size: 0
	},
	'fatal': {
		data: [],
		size: 0
	}
};
// default 8 KB
var limit = 8192;

module.exports.setup = function (config) {
	if (config) {
		limit = config;
	}
};

module.exports.add = function (level, msg) {
	var data = msg.message;
	buff[level].data.push(msg.message);
	buff[level].size += Buffer.byteLength(data);
	if (buff[level].size > limit) {
		return module.exports.flush(level);
	}
	return null;
};

module.exports.flush = function (level) {
	var data = buff[level].data;
	buff[level].data = [];
	buff[level].size = 0;
	return { message: data.join('\n') };
};

module.exports.flushAll = function () {
	var flushed = {};
	for (var level in buff) {
		flushed[level] = module.exports.flush(level);
	}
	return flushed;
};

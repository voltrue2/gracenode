var buff = {
	'verbose': {
		messages: [],
		timestamps: [],
		size: 0
	},
	'debug': {
		messages: [],
		timestamps: [],
		size: 0
	},
	'trace': {
		messages: [],
		timestamps: [],
		size: 0
	},
	'info': {
		messages: [],
		timestamps: [],
		size: 0
	},
	'warn': {
		messages: [],
		timestamps: [],
		size: 0
	},
	'error': {
		messages: [],
		timestamps: [],
		size: 0
	},
	'fatal': {
		messages: [],
		timestamps: [],
		size: 0
	}
};
// default 8 KB
var limit = 8192;

module.exports.setup = function (size) {
	if (size !== undefined && size !== null) {
		limit = size;
	}
};

module.exports.add = function (level, msg) {
	buff[level].messages.push(msg.message);
	buff[level].timestamps.push(msg.timestamp);
	buff[level].size += Buffer.byteLength(msg.message);
	if (buff[level].size > limit) {
		return module.exports.flush(level);
	}
	return null;
};

module.exports.flush = function (level) {
	if (buff[level].size) {
		var data = { 
			messages: buff[level].messages,
			timestamps: buff[level].timestamps
		};
		buff[level].messages = [];
		buff[level].timestamps = [];
		buff[level].size = 0;
		return data;
	}
	return null;
};

module.exports.flushAll = function () {
	var flushed = {};
	for (var level in buff) {
		flushed[level] = module.exports.flush(level);
	}
	return flushed;
};

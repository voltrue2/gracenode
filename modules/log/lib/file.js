var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var events = new EventEmitter();

var writeOptions = {
	flags: 'a',
	mode: parseInt('0644', 8),
	encoding: 'utf8'
};

var streams = {};
var paths = {};

events.on('write', function (stream, msg) {
	stream.write(msg);
});

module.exports.setup = function (gn, levelMap) {
	// create map for file paths (enabled level ONLY)
	for (var levelName in levelMap) {
		var level = levelMap[levelName];
		if (level.enabled) {
			paths[levelName] = level.path + levelName;
		}
	}
	
	// cleaner
	gn._setLogCleaner('log', function (done) {
		for (var levelName in streams) {
			destroyWriteStream(levelName);
		}
		done();
	});
};

module.exports.log = function (levelName, msg) {
	var stream = getWriteStream(levelName);
	events.emit('write', stream, msg + '\n');
};

function getWriteStream(levelName) {
	// create log file path
	var path = paths[levelName];
	if (!path) {
		console.log('invalid log level given:', levelName, paths);
		return null;
	}
	
	var filePath = path + '.' + today() + '.log';

	// check to see if the date-base file path is still valid
	if (streams[levelName] && streams[levelName].path !== filePath) {
		// the date has changed
		destroyWriteStream(levelName);
	}

	// create a new write stream if needed
	if (!streams[levelName]) {
		createWriteStream(levelName, filePath);
	}
	
	return streams[levelName].stream;
}

function createWriteStream(levelName, filePath) {
	// create a new write stream
	var stream = fs.createWriteStream(filePath, writeOptions);

	// error listener
	stream.on('error', function (error) {
		console.error('log.file: Error:', error);
	});

	// add the new stream to stream map
	streams[levelName] = {
		path: filePath,
		stream: stream
	};
}

function destroyWriteStream(levelName) {
	if (streams[levelName]) {
		streams[levelName].stream.end();
		delete streams[levelName];
	}
}

function today() {
	var d = new Date();
	return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate());
}

function pad(n) {
	if (n < 10) {
		return '0' + n;
	}
	return n;
}

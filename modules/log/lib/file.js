var fs = require('fs');

var today = require('./today');

var writeOptions = {
	flags: 'a',
	mode: parseInt('0644', 8),
	encoding: 'utf8'
};

var streams = {};
var paths = {};

module.exports.setup = function (gn, levelMap, path) {
	
	if (!path) {
		// no file logging
		return;
	}

	// create map for file paths (enabled level ONLY)
	for (var levelName in levelMap) {
		var level = levelMap[levelName];
		if (level) {
			paths[levelName] = path + levelName;
		}
	}
	
	// cleaner
	gn._addLogCleaner('log.file', function (done) {
		for (var levelName in streams) {
			destroyWriteStream(levelName);
		}
		done();
	});
};

module.exports.log = function (levelName, msg) {
	var stream = getWriteStream(levelName);
	stream.write('[timestamp:' + msg.timestamp + '] ' + msg.message + '\n');
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

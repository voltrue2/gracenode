var http = require('http');
var checkInterval = 1000; // interval for checking outstanding events
var eventList = [];
var emitter = require('events').EventEmitter();

exports.start = function () {
	// set up polling listener	
	emitter.on('respond', function (args) {
	});

	console.log('polling listener set up complete');

	// set up polling server
	var server = http.createServer(function (req, response) {
		
	});
};

exports.emit = function () {
	// first element is required event name as a string
	if (!arguments[0]) {
		throw new Error('missing required argument 1 (event name)');
	}
	emitter.emit('respond', arguments);
};

function checkEvent(response, args) {
	var event = eventList.shift();
	if (event) {
		respond(response, args);
	}
	setTimeout(function () {
		checkEvent(response, args);
	}, checkInterval);
}

function respond(response, args) {
	response.writeHeader(200, {
		'Cache-Control': 'no-cache, must-revalidate',
		'Connection': 'Keep-Alive',
		'Content-type': 'text/plain',
		'Content-Encoding': 'gzip'
	});
	response.write(JSON.stringify(args));
	response.end();
}

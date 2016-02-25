var net = require('net');
var host = process.argv[2] || 'localhost';
var port = process.argv[3] || 8889;
var interval = process.argv[4] ? process.argv[4] * 1000 : 1000;

var MAX = 10;
var counter = 0;

var client = new net.Socket();
client.connect(port, host, function () {
	var call = function () {

		if (counter === MAX) {
			//done
			client.end();
			return;
		}

		counter++;

		console.log('send packet #' + counter);

		client.write(JSON.stringify({
			endPoint: process.argv[2],
			data: { time: Date.now(), input: process.argv[3] || null } 
		}));
		setTimeout(call, interval);
	};
	console.log('send packet every', (interval / 1000), 'seconds');
	call();
});

client.on('data', function (data) {
	console.log('response from the server:', data.toString());
});

client.on('close', function () {
	console.log('closed');
});

client.on('error', function (data) {
	console.log('error:', data.toString());
	process.exit();
});

process.on('uncaughtException', function () {
	console.error(arguments);
});

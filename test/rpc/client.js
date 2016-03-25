var net = require('net');
var host = process.argv[2] || 'localhost';
var port = process.argv[3] || 8889;
var interval = process.argv[4] ? process.argv[4] * 1000 : 1000;

var PacketParser = require('../../lib/packet');
var protocol = require('../../lib/packet/protocol');

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

		var list = [];
		for (var i = 0; i < 1; i++) {
			list.push(counter * i);
		}

		var packet;
		var cmdId = 1;
		var seq = 0;
		var payload = JSON.stringify({ a: 'AAA', b: 'BBB', c: 10000, d: 53.632, list: list });
		// regular TCP
		var packetParser = new PacketParser(console);
		packet = packetParser.createReq(cmdId, seq, payload);
		// send
		client.write(packet);
		setTimeout(call, interval);
	};
	console.log('send packet every', (interval / 1000), 'seconds');
	call();
});

client.on('data', function (data) {
	console.log('response from the server:', data);
	var parsed = protocol.parseData(data);
	console.log('parsed response from the server:', parsed, JSON.parse(parsed.payload));
});

client.on('close', function () {
	console.log('closed');
});

client.on('error', function (data) {
	console.log('error:', data);
	process.exit();
});

process.on('uncaughtException', function () {
	console.error(arguments);
});

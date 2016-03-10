'use strict';

var gn = require('../../src/gracenode');
var dgram = require('dgram');
var client = dgram.createSocket('udp4');
var host = process.argv[2];
var ports = process.argv[3].split(',');
var speed = process.argv[4] || 3000;
var counter = 0;

var bigText = '';

for (var i = 0; i < 1000; i++) {
	bigText += i.toString();
}

gn.config({
	cluster: {
		max: 4
	}
});

gn.start(loop);

function loop() {
	setTimeout(function () {
		send(new Buffer(JSON.stringify({ now: Date.now(), text: bigText })));
	}, speed);
}

function send(data) {
	var offset = 0;
	var length = data.length;
	var s = Date.now();
	client.send(data, offset, length, ports[counter], host, function (error) {
		if (error) {
			console.error('error:', error);
		}
		counter += 1;
	
		if (!ports[counter]) {
			counter = 0;
		}

		console.log('done sent size:', length, (Date.now() - s) + 'ms');
		loop();
	});
}

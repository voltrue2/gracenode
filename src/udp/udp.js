'use strict';

var gn = require('../gracenode');
var dgram = require('dgram');

var PORT_IN_USE = 'EADDRINUSE';

var logger;
var config;
var server;

module.exports.setup = function (cb) {
	logger = gn.log.create('UDP');
	config = gn.getConfig('udp');

	if (!config || !config.portRange) {
		return cb();
	}
	
	if (!config.address) {
		logger.info('UDP server will listen to all address: 0.0.0.0');
		config.address = '0.0.0.0';
	}

	if (!Array.isArray(config.portRange) || config.portRange.length < 2) {
		logger.error(
			'incorrect port range',
			'(must be an array of 2 elements from smallest to biggest):',
			config.portRange
		);
		throw new Error('<PORT_RANGE_FOR_UDP_SERVER_INCORRECT>');
        }

	var running = false;
	var ports = [];
        var portIndex = 0;
        var boundPort;

	var done = function () {
		// UDP server is now successfully bound and listening
		boundPort = ports[portIndex];
		// gracenode shutdown task
		gn.onExit(function UDPShutdown(next) {

			if (!running) {
				logger.info(
					'UDP server not running yet [skipp]:',
					config.address + ':' + boundPort
				);
				return next();
			}

			logger.info(
				'UDP server closing',
				config.address + ':' + boundPort
			);

			server.close();

			next();
		});

		running = true;
		server.on('message', handleMessage);

		logger.info('UDP server started at', config.address + ':' + boundPort);

		cb();
        };
	var listen = function () {
		
		if (server) {
			server.close();
		}

		var port = ports[portIndex];
		logger.verbose('binding to:', config.address + ':' + port);
		// create UDP server
		server = dgram.createSocket('udp4');
		server.on('error', handleError);
		server.on('listening', done);
		server.bind({
			port: port,
			address: config.address,
			// make sure all workers do NOT share the same port
			exclusive: true
		});
	};
	var handleError = function (error) {
		if (error.code === PORT_IN_USE) {
			// try next port in range
			var badPort = ports[portIndex];
			logger.verbose('port is in use:', badPort);
			portIndex += 1;
			if (!ports[portIndex]) {
				// there's no more port in range
				error.message += ' (port:' + badPort + ')';
				return gn.stop(error);
			}
			return listen();
		}
		gn.stop(error);
	};

        for (var p = config.portRange[0]; p <= config.portRange[1]; p++) {
                ports.push(p);
        }

        logger.verbose('port range is', config.portRange[0], 'to', config.portRange[1]);

	listen();
};

function handleMessage(buff) {
	logger.info('message received:', server.address(), buff.toString('utf8'));
}

// test code
gn.config({
	udp: {
		portRange: [7980, 7990]
	},
	log: {
		color: true,
		console: true,
		level: '>= verbose'
	},
	cluster: {
		max: 3
	}
});
gn.start(function () {
	if (!gn.isMaster()) {
		module.exports.setup(function () {
			console.log('ready');
		});
	}
});

'use strict';

const gn = require('../../src/gracenode');
const Fs = require('./fs');

if (!process.argv[2]) {
	process.exit(1);
}

const NAME = process.argv[2] + ':' + process.pid;

gn.config({
	log: {
		level: 'debug >=',
		console: true,
		color: true
	},
	cluster: {
		max: 2
	},
	portal: {
		enable: true,
		compress: true,
		relayLimit: 1,
		address: '127.0.0.1',
		port: 9000,
		announce: {
			host: '127.0.0.1',
			port: 6379,
			interval: 1000
		}
	}
});

gn.start(function () {

	if (gn.isMaster()) {
		return;
	}

	const logger = gn.log.create();
	const fs = new Fs(NAME);
	
	gn.onExit(function stopTestPortalServer(next) {
		fs.delete(function (error, data) {
			logger.debug('read and stop', error, data);
			next();
		});
	});

	gn.portal.define('msg', {
		time: gn.portal.DATATYPE.DOUBLE,
		from: gn.portal.DATATYPE.STR,
		order: gn.portal.DATATYPE.UINT8
	});
	gn.portal.on('msg', function (data) {
		data.by = NAME;
		fs.write(data, function () {
			logger.debug('written:', data);
		});
	});
	// first communication
	setTimeout(function () {
		const list = gn.portal.getAllNodes();
		const data = {
			time: Date.now(),
			from: NAME,
			order: 0
		};
		try {
			gn.portal.relay('msg', list, data);
		} catch (error) {
			logger.error(error);
		}
	}, 10000);
});

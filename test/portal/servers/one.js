'use strict';

const gn = require('../../../index');
var logger;

gn.config({
	log: {
		console: true,
		color: true,
		level: 'debug >=',
		file: __dirname + '/logs/'
	},
	cluster: {
		max: 2
	},
	portal: {
		type: 'server-one',
		address: '127.0.0.1',
		port: 4000,
		relayLimit: 1,
		compress: false,
		announce: {
			host: '127.0.0.1',
			port: 6379,
			interval: 1000
		}
	},
	http: {
		host: '127.0.0.1',
		port: 8500
	}
});

gn.portal.onAnnounce(function () {
	gn.portal.setNodeValue('one-value-key', 'one-value-' + Date.now());
});

const remember = {};

gn.start(function () {
	gn.log.setPrefix('ONE');
	logger = gn.log.create();
	const TYPE = gn.portal.TYPE;
	gn.portal.define('one2two', {
		bool: TYPE.BOOL,
		str: TYPE.STR,
		strlist: TYPE.STR_ARR,
		obj: {
			num: TYPE.UINT32,
			uuid: TYPE.UUID,
			bin: TYPE.BIN
		}
	}, {
		bool: TYPE.BOOL,
		str: TYPE.STR,
		strlist: TYPE.STR_ARR,
		obj: {
			num: TYPE.UINT32,
			uuid: TYPE.UUID,
			bin: TYPE.BIN
		}
	});
	gn.portal.define('two2one', {
		bool: TYPE.BOOL,
		str: TYPE.STR,
		strlist: TYPE.STR_ARR,
		obj: {
			num: TYPE.UINT32,
			uuid: TYPE.UUID,
			bin: TYPE.BIN
		}
	});
	gn.portal.on('two2one', function (payload) {
		remember.two2one = payload;
	});

});

gn.http.get('/one2two', function (req, res) {
	const data = {
		bool: true,
		str: 'one2two',
		strlist: [ 'one', 'two', 'three' ],
		obj: {
			num: 1024,
			uuid: gn.lib.uuid.v4().toBytes(),
			bin: new Buffer(10)
		}
	};
	const nodes = gn.portal.getNodes('server-two');
	if (!nodes.length) {
		return res.error(new Error('NoNodeFound'));
	}
	logger.debug('emit event one2two', nodes, data);
	gn.portal.emit('one2two', nodes, data, function (error, resp) {
		if (error) {
			return res.error(error);
		}
		logger.debug('successfully finished emit event one2two', nodes, data);
		res.json(resp);
	});
});

gn.http.get('/two2one', function (req, res) {
	res.json(remember.two2one);
});


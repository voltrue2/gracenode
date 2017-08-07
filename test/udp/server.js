'use strict';

var gn = require('../../src/gracenode');

gn.config({
	http: {
		host: '0.0.0.0',
		port: 7979
	},
	udp: {
		supportJSON: false,
		address: 'fe80::5054:1ff:fe00:3345%eth0',
		portRange: [7980]
	},
	log: {
		color: true,
		console: true,
		level: '>= verbose'
	}
});

gn.http.post('/auth', handleAuth);
if (process.argv[2] === 'secure') {
	gn.session.sessionDuration(100000);
	gn.session.useUDPSession();
	console.log('Starting UDP server in secure mode');
}
gn.udp.hook(1, testHook1);
gn.udp.command(1, 'testCommand1', testCommand1);

gn.start();

function testHook1(state, next) {
	console.log('command hook', state.sessionId, state.seq);
	next();
}

function testCommand1(state) {
	console.log('command', state.payload.toString());
	state.send(
		{
			message: 'Echo',
			payload: state.payload
		},
		state.status.OK
	);
}

function handleAuth(req, res) {
	var data = { data: 'session data' };
	gn.session.setHTTPSession(req, res, data, function (error) {
		if (error) {
			return res.error(error);
		}
		res.json({
			sessionId: req.args.sessionId,
			host: '0.0.0.0',
			port: 7980,
			cipherData: req.args.cipher
		});
	});	
}

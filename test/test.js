#!/usr/bin/env node

var gn = require('../');
gn.setConfigPath('node_modules/gracenode/test/configs/');
gn.setConfigFiles([ 'daemon.json' ]);
gn.start(function () {
	setInterval(function () {

	}, 100000);
});

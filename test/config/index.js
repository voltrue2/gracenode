'use strict';

var logEnabled = require('../arg')('--log');
const gn = require('../../src/gracenode');
const assert = require('assert');
const dir = __dirname;

describe('gracenode configurations w/ ENV variables', function () {
	
	process.env.GN_CONF = dir + '/conf.json';
	process.env.GN_BOO = 'foo';
	process.env.GN_WORLD = 'world!';

	it('Can set prefix to be "GN"', function () {
		gn.setEnvPrefix('GN');
		gn.config({
			log: {
				level: 'verbose >=',
				console: logEnabled,
				color: true
			},
			cluster: {
				max: 0
			}
		});
	});

	it('Can set up gracenode w/ configurations with placeholders', function () {
		gn.config({
			hello: '{$WORLD}'
		});
	});

	it('Can start gracenode', function (done) {
		gn.start(done);
	});

	it('Can read configurations that are loaded from ENV variable', function () {
		const conf = gn.getConfig('test');
		assert(conf);
		assert.equal(conf.date, '03/17/2017');
		assert.equal(conf.foo, 'foo');
		const hello = gn.getConfig('hello');
		assert(hello);
		assert.equal(hello, 'world!');
	});

});

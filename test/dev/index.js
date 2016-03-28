var logEnabled = require('../arg')('--log');
var assert = require('assert');
var gn = require('../../src/gracenode');

describe('dev set up gracenode', function () {
	
	it('start gracenode', function (done) {
		gn.config({
			log: {
				console: logEnabled
			}
		});
		gn.start(done);
	});

	it('can gracenode.require', function () {
		var req = gn.require('../../../test/lib/path');
		assert.notEqual(req, null);
	});

	it('can create UUID v4', function () {
		var uuid = gn.lib.uuid.v4();
		console.log(uuid.toString());
		console.log(uuid.toBytes());
	});

});

var assert = require('assert');
var gn = require('../../src/gracenode');

describe('dev set up gracenode', function () {
	
	it('start gracenode', function (done) {
		gn.config({
			log: {
				console: false
			}
		});
		gn.start(done);
	});

	it('can gracenode.require', function () {
		var req = gn.require('../../../test/lib/path');
	});

});

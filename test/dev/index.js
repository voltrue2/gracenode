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

	it('can loop an array using gracenode.async.forEachSeries', function (done) {
		var list = [ 0, 1, 2, 3, 4, 5 ];
		gn.async.forEachSeries(list, function (item, next, index) {
			assert.equal(item, index);
			next();
		}, function (error) {
			assert.equal(error, null);
			done();
		});
	});

	it('can loop an array using gracenode.async.loopSeries', function (done) {
		var list = [ 0, 1, 2, 3, 4, 5 ];
		var params = 'hello';
		gn.async.loopSeries(list, params, function (item, param, next, index) {
			assert.equal(item, index);
			assert.equal(params, param);
			next();
		}, function (error) {
			assert.equal(error, null);
			done();
		});
	});

});

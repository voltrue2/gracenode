var gn = require('../../');
var assert = require('assert');
var fs = require('fs');

var logger;

describe('view module ->', function () {

	it('Can set up gracenode', function (done) {

		gn.setConfigPath('node_modules/gracenode/test/configs/');
		gn.setConfigFiles(['view.json']);

		gn.use('view');

		gn.setup(function (error) {

			assert.equal(error, undefined);

			logger = gn.log.create('test');

			done();
		});

	});

	it('Can load a view file', function (done) {

		var view = gn.view.create();

		view.assign('test', 'test');

		view.load('node_modules/gracenode/test/view/test.html', function (error, content) {
			assert.equal(error, null);
			done();
		});

	});

});

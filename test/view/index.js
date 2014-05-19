var gn = require('../../');
var assert = require('assert');

describe('view module ->', function () {

	it('Can load a view file', function (done) {

		gn.setConfigPath('gracenode/test/configs/');
		gn.setConfigFiles(['index.json']);

		gn.use('view');

		gn.setup(function (error) {
			assert.equal(error, undefined);
			var view = gn.view.create();
			view.assign('test', 'test');
			view.load('gracenode/test/view/test.html', function (error, content) {
				assert.equal(error, null);
				done();
			});
		});

	});

});

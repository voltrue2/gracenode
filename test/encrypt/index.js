var assert = require('assert');
var gn = require('../../');

describe('encrypt module ->', function () {

	var pass = 'abcdefg';
	var hash;

	it('Can create a hash', function (done) {
		
		gn.setConfigPath('gracenode/test/configs/');
		gn.setConfigFiles(['index.json']);

		gn.use('encrypt');

		gn.setup(function (error) {
			assert.equal(error, undefined);
			gn.encrypt.createHash(pass, 10, function (error, newHash) {
				assert.equal(error, undefined);
				assert(newHash);
				hash = newHash;
				done();
			});
		});

	});

	it('Can validate the hash', function (done) {
		gn.encrypt.validateHash(pass, hash, function (error, validated) {
			assert.equal(error, undefined);
			assert.equal(validated, true);
			done();
		});
	});

	it('Can generate uuid', function () {
		var uuid = gn.encrypt.uuid(4);
		assert(uuid);
	});

});

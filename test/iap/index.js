var gn = require('../../');
var assert = require('assert');
var fs = require('fs');

var path;
// apple or google
var service;

describe('iap (in-app-purchase) module ->', function () {
	
	console.log('For this test to properly work, we need to have both Apple and Google purchase receipt files.');

	it('Can set up iap module', function (done) {
		path = process.argv[process.argv.length - 2].replace('--path=', '');
		service = process.argv[process.argv.length - 1].replace('--service=', '');

		if (service !== 'apple' && !service !== 'google') {
			throw new Error('Unkown service: ' + service);
		}

		gn.setConfigPath('node_modules/gracenode/test/configs/');
		gn.setConfigFiles(['iap.json']);
		gn.use('request');
		gn.use('mysql');
		gn.use('iap');
		gn.setup(function (error) {
			assert.equal(error, undefined);
			done();
		});
	});

	it('Can test purchase', function (done) {
		console.log('Testing ' + service);
		fs.readFile(path, function (error, data) {
			assert.equal(error, undefined);
			var receipt = data.toString('utf8');
			switch (service) {
				case 'apple':
					gn.iap.testApple(receipt, function (error, res) {
						assert.equal(error, undefined);
						console.log(res);
						done();
					});
					break;
			}
		});
	});

	/* need to think of a way to use pem key...
	it('Can validate google purchase', function (done) {
		fs.readFile(googlePath, function (error, data) {
			assert.equal(error, undefined);
			var receipt = JSON.parse(data.toString('utf8'));
			gn.iap.testGoogle(receipt, function (error, res) {

				console.log(error, res);

				assert.equal(error, undefined);
				console.log(res);
				done();
			});
		});
	});
	*/

});

var gn = require('../../');
var assert = require('assert');
var fs = require('fs');

var path;
// apple or google
var service;
var pem;

describe('iap (in-app-purchase) module ->', function () {
	
	console.log('For this test to properly work, we need to have both Apple and Google purchase receipt files.');

	it('Can set up iap module', function (done) {
		path = process.argv[process.argv.length - 2].replace('--path=', '');
		service = process.argv[process.argv.length - 1].replace('--service=', '');

		if (service !== 'apple' && service !== 'google') {
			throw new Error('Unkown service: ' + service);
		}

		if (service === 'google') {
			pem = process.argv[process.argv.length - 3].replace('--key=', '');
			// override config value for pem path for google test
			gn.on('setup.config', function () {
				var conf = gn.config.getOne('modules.iap');
				conf.googlePublicKeyPath = pem;
			});
		}

		gn.setConfigPath('gracenode/test/configs/');
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
						assert.equal(gn.iap.isValidated(res), true);
						console.log(res);
						done();
					});
					break;
				case 'google':
					receipt = JSON.parse(receipt);
					gn.iap.testGoogle(receipt, function (error, res) {
						
						console.log(error, res);

						assert.equal(error, undefined);
						assert.equal(gn.iap.isValidated(res), true);
						console.log(res);
						done();
					});
					break;
			}
		});
	});

});

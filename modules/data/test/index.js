var assert = require('assert');
var gn = require('gracenode');
var prefix = 'node_modules/gracenode/modules/data/test/';

describe('Data Model', function () {

	var testDef;
	var testModel;
	var idList = [];

	it('Can set up gracenode', function (done) {
		gn.setConfigPath(prefix + 'configs/');
		gn.setConfigFiles(['conf.json']);
		gn.use('data');
		gn.setup(done);
	});

	it('Cannot set up model definition with a driver without .create()', function () {
		try {
			testDef = gn.data.defineModel('test', {});
		} catch (error) {
			assert.equal(error.code, 'createFunctionInvalid');
		}
	});

	it('Cannot set up model definition with a driver without .read()', function () {
		try {
			testDef = gn.data.defineModel('test', { create: function () {} });
		} catch (error) {
			assert.equal(error.code, 'readFunctionInvalid');
		}
	});

	it('Cannot set up model definition with a driver without .update()', function () {
		try {
			testDef = gn.data.defineModel('test', { create: function () {}, read: function () {} });
		} catch (error) {
			assert.equal(error.code, 'updateFunctionInvalid');
		}
	});

	it('Cannot set up model definition with a driver without .delete()', function () {
		try {
			testDef = gn.data.defineModel('test', { create: function () {}, read: function () {}, update: function () {}, delete: function () {} });
		} catch (error) {
			assert.equal(error.code, 'deleteFunctionInvalid');
		}
	});

	it('Cannot set up model definition with a driver with an invalid .search()', function () {
		try {
			testDef = gn.data.defineModel('test', { create: function () {}, read: function () {}, update: function () {}, delete: function () {}, search: true });
		} catch (error) {
			assert.equal(error.code, 'searchFunctionInvalid');
		}
	});

	it('Cannot set up model definition with a driver with an invalid .transactionStart()', function () {
		try {
			testDef = gn.data.defineModel('test', { create: function () {}, read: function () {}, update: function () {}, delete: function () {}, transactionStart: true });
		} catch (error) {
			assert.equal(error.code, 'transactionStartFunctionInvalid');
		}
	});

	it('Cannot set up model definition with a driver with an invalid .transactionEnd()', function () {
		try {
			testDef = gn.data.defineModel('test', { create: function () {}, read: function () {}, update: function () {}, delete: function () {}, transactionStart: function () {}, transactionEnd: true });
		} catch (error) {
			assert.equal(error.code, 'transactionEndFunctionInvalid');
		}
	});

	it('Can set up model definition and model', function () {		
		testDef = gn.data.defineModel('test', gn.require(prefix + 'drivers/test'));
		testModel = testDef.createModel();
	});

	it('Cannot create model data witout defining model constraints', function (done) {
		testModel.create(function (error) {
			assert.equal(error.code, 'modelConstraintsNotDefined');
			done();
		});
	});

	it('Can define model constraints', function () {
		testDef.defineConstraint('name', 'no name', function (value) {
			if (typeof value !== 'string') {
				return false;
			}
			if (value.length < 4 || value.length > 10) {
				return false;
			}
			return true;
		});
		testDef.defineConstraint('age', 0, function (value) {
			if (typeof value !== 'number') {
				return false;
			}
			if (value < 0) {
				return false;
			}
			return true;
		});
	});

	it('Cannot define model constraint that has already been defined', function () {
		try {
			testDef.defineConstraint('age', 0, function (value) {
				if (typeof value !== 'number') {
					return false;
				}
				if (value < 0) {
					return false;
				}
				return true;
			});
		} catch (error) {
			assert(error);
			assert.equal(error.code, 'duplicateConstraint');
		}
	});

	it('Cannot update model data before calling create/read', function (done) {
		testModel.update(function (error) {
			assert.equal(error.code, 'noDataToUpdate');
			done();
		});
	});

	it('Can create model data with default values only', function (done) {
		testModel.create(function (error) {
			assert.equal(error, undefined);
			assert.equal(testModel.get('name'), 'no name');
			assert.equal(testModel.get('age'), 0);
			done();
		});
	});

	it('Cannot create model data more than once', function (done) {
		testModel.create(function (error) {
			assert.equal(error.code, 'dataAlreadyExists');
			done();
		});
	});

	it('Cannot set protected model data', function () {
		var success = testModel.set('__id', 'foo');
		assert.equal(success, false);
	});

	it('Cannot set an invalid value to a property', function () {
		var success = testModel.set('name', 'Foo1234567890');
		assert.equal(success, false);
		assert.equal(testModel.get('name'), 'no name');
	});

	it('Can set a valid value to a property', function () {
		var success = testModel.set('age', 100);
		assert.equal(success, true);
		assert.equal(testModel.get('age'), 100);
	});

	it('Can update module data', function (done) {
		testModel.update(function (error) {
			assert.equal(error, undefined);
			assert.equal(testModel.get('name'), 'no name');
			assert.equal(testModel.get('age'), 100);
			done();
		});
	});

	it('Can delete model data', function (done) {
		testModel.delete(function (error) {
			assert.equal(error, undefined);
			assert.equal(testModel.get('name'), null);
			assert.equal(testModel.get('age'), null);
			done();
		});
	});

	it('Can create model data with custom values', function (done) {
		var success = testModel.set('name', 'FooMan');
		assert.equal(success, true);
		success = testModel.set('age', 40);
		assert.equal(success, true);
		testModel.create(function (error) {
			assert.equal(error, undefined);
			assert.equal(testModel.get('name'), 'FooMan');
			assert.equal(testModel.get('age'), 40);
			idList.push(testModel.getId());
			done();
		});
	});

	it('Cannot read model data with invalid ID', function (done) {
		var model = testDef.createModel();
		model.read('fakeId', function (error) {
			assert(error);
			assert.equal(model.get('name'), null);
			assert.equal(model.get('age'), null);
			done();
		});
	});

	it('Can read model data', function (done) {
		var model = testDef.createModel();
		model.read(idList[0], function (error) {
			assert.equal(error, undefined);
			assert.equal(model.get('name'), 'FooMan');
			assert.equal(model.get('age'), 40);
			done();
		});
	});

	it('Can create another model data', function (done) {
		var model = testDef.createModel();
		model.create(function (error) {
			assert.equal(error, undefined);
			idList.push(model.getId());
			done();
		});
	});

	it('Can search models an array of IDs', function (done) {
		testDef.searchModels(idList, function (error, models) {
			assert.equal(error, undefined);
			for (var id in models) {
				assert.notEqual(idList.indexOf(id), -1);
			}
			assert.equal(models[idList[0]].get('name'), 'FooMan');
			assert.equal(models[idList[0]].get('age'), 40);
			assert.equal(models[idList[1]].get('name'), 'no name');
			assert.equal(models[idList[1]].get('age'), 0);
			done();
		});
	});	

});

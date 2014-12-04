'use strict';

var gn = require('gracenode');
var Model = require('./model');
var ModelError = require('./model-error');
var logger = gn.log.create();

var required = [
	'create',
	'read',
	'update',
	'delete'
];

/*

required functions for a valid driver

create()
read()
update()
delete()
search() <optional>
transactionStart() <optional>
transactionEnd() <optional> but required if transactionStart is provided

*/

module.exports = ModelDefinition;

function validateDriver(driver) {
	if (!driver) {
		throw new ModelError('invalidDriver', 'driver object must be provided');
	}
	// check required functions (CRUD functions)
	for (var i = 0, len = required.length; i < len; i++) {
		if (typeof driver[required[i]] !== 'function') {
			throw new ModelError(required[i] + 'FunctionInvalid', required[i] + ' must be a function, but ' + driver[required[i]] + ' given');
		}
	}
	// if optional search() is present, it must be a function
	if (driver.search && typeof driver.search !== 'function') {
		throw new ModelError('searchFunctionInvalid', 'search must be a function, but ' + driver.search + ' given');
	}
	// if optional transactionStart() is present, it must be a function and transactionEnd() must be provided
	if (driver.transactionStart) {
		if (typeof driver.transactionStart !== 'function') {
			throw new ModelError('transactionStartFunctionInvalid', 'transactionStart must be a function, but ' + driver.transactionStart + ' given');
		}
		if (typeof driver.transactionEnd !== 'function') {
			throw new ModelError('transactionEndFunctionInvalid', 'transactionEnd must be a function, but ' + driver.transactionEnd + ' given');
		}
	}
}

// model name is a table/collection/prefix
function ModelDefinition(modelName, driver) {
	
	validateDriver(driver);

	this.modelName = modelName;
	this.constraints = {};
	this.driver = driver;
}

ModelDefinition.prototype.defineConstraint = function (dataName, defaultValue, validationFunction) {
	if (typeof dataName !== 'string') {
		throw new ModelError('dataNameMustBeString', 'dataName must be a string, but ' + dataName + ' given');
	}
	// if optional validationFunction is present
	if (validationFunction) {
		if (typeof validationFunction !== 'function') {
			throw new ModelError('validationMustBeFunction', 'optional validation must be a function, but ' + validationFunction + ' given');
		}
		if (!validationFunction(defaultValue)) {
			throw new ModelError('invalidDefaultValue', 'default value must be valid: ' + defaultValue);
		}
	}
	if (this.constraints[dataName]) {
		throw new ModelError('duplicateConstraint', 'cannot define already defined constraint: ' + dataName);
	}
	this.constraints[dataName] = {
		default: defaultValue,
		validate: validationFunction
	};		
};

ModelDefinition.prototype.createModel = function () {
	return new Model(this);
};

// returns a map of model objects found
ModelDefinition.prototype.searchModels = function (idList, cb) {
	if (!this.driver.search) {
		return cb(new ModelError('searchNotSupported', this.modelName + ' model does not support .search()'));
	}
	var that = this;
	var res = {};
	this.driver.search(this.modelName, idList, function (error, list) {
		if (error) {
			logger.error('search failed: [model:' + that.modelName + ']', error);
			return cb(error);
		}
		for (var i = 0, len = list.length; i < len; i++) {
			var model = that.createModel(that);
			model.load(list[i]);
			res[list[i].__id] = model;
		}
		logger.verbose('models searched:', res);
		cb(null, res);
	});
};

// FIXME: well... we need to be able to handle rollback on every model used in a transaction...
ModelDefinition.prototype.transactionStart = function (cb) {
	if (!this.driver.transactionStart) {
		return cb(new ModelError('transactionStartNotSupported', this.modelName + ' does not support transaction'));
	}
	var that = this;
	this.driver.transactionStart(function (error) {
		if (error) {
			logger.error('transaction start failed: [model:' + that.modelName + ']', error);
			cb(error);
		}
		logger.info('transaction started');
		cb();
	});
};

// TODO: implement
ModelDefinition.prototype.transactionEnd = function (cb) {
	cb();
};

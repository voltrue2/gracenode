'use strict';

var gn = require('gracenode');
var uuid = require('node-uuid');
var logger = gn.log.create();
var ModelError = require('./model-error');

// these properties will always be present and protected
var protectedProps = [
	'__id',
	'created',
	'modified'
];

module.exports = Model;

function isProtected(propName) {
	if (protectedProps.indexOf(propName) !== -1) {
		return true;
	}
	return false;
}

function Model(modelDef) {
	// definitions of the model
	this.name = modelDef.modelName;
	this.driver = modelDef.driver;
	this.constraints = modelDef.constraints;
	// data of the data model
	this.data = {};
	// redundant backup data for transaction rollback in local memory
	this.backup = {};
	// flag of the model state: if true, the model has the data from driver/database and cannot call .create()
	this.loaded = false;
}

Model.prototype.getId = function () {
	return this.data.__id;
};

Model.prototype.get = function (name) {
	if (this.data.hasOwnProperty(name)) {
		return this.data[name];
	}
	return null;
};

Model.prototype.set = function (name, value) {
	if (isProtected(name)) {
		logger.error('cannot set a value to protected property:', name, value);
		return false;
	}
	if (!this.constraints.hasOwnProperty(name)) {
		logger.error('property not defined:', name, value);
		return false;
	}
	// validate value
	var constraint = this.constraints[name];
	if (constraint.validate && !constraint.validate(value)) {
		logger.error('cannot set an invalid value:', name, value);
		return false;
	}
	// set value
	logger.verbose(this.name, 'setting a value to', name, this.data[name], '->', value);
	this.data[name] = value;
	// set backup value
	if (!this.backup.hasOwnProperty(name)) {
		logger.verbose(this.name, 'setting local memory backup to', name, value);
		this.backup[name] = value;
	}
	return true;
};

Model.prototype.create = function (cb) {
	if (this.loaded) {
		return cb(new ModelError('dataAlreadyExists', this.name, 'data already exists and cannot call .create()'));
	}
	var err = this.formatData();

	if (err) {
		return  cb(err);
	}

	this.setProtectedProperties();
	var that = this;
	this.driver.create(this.name, this.getId(), this.data, function (error, result) {
		if (error) {
			logger.error('create failed: [mode:' + that.name + ']', that.data, error);
			that.rollback();
			return cb(error);
		}
		that.loaded = true;
		logger.info('data created', that.name, that.data);
		cb(null, result);
	});
};

// load() is called from .search()
Model.prototype.load = function (data) {
	if (this.loaded) {
		logger.error(this.name, 'data already exists and canno call .load()');
		return false;
	}
	if (data) {
		this.data = data;
		this.backup = data;
	}
	var err = this.formatData();

	if (err) {
		logger.error(err);
		return  false;
	}

	this.loaded = true;
	logger.verbose('data loaded', this.name, data);
	return true;
};

// read() can be call as many times as it needs to be called
Model.prototype.read = function (id, cb) {
	var that = this;
	this.driver.read(this.name, id, function (error, data) {
		if (error) {
			logger.error('read failed: [model:' + that.name + ']', id, error);
			return cb(error);
		}
		if (data) {
			that.data = data;
			that.backup = data;
		}
		var err = that.formatData();

		if (err) {
			return  cb(err);
		}

		that.loaded = true;
		logger.verbose('data read', that.name, id, that.data);
		cb();
	});
};

Model.prototype.update = function (cb) {
	if (!this.loaded) {
		return cb(new ModelError('noDataToUpdate', 'data must be either created or read before update: ' + this.name));
	}
	var that = this;
	var err = this.formatData();

	if (err) {
		this.rollback();
		return  cb(err);
	}

	this.data.modified = Date.now();
	this.driver.update(this.name, this.getId(), this.data, function (error, result) {
		if (error) {
			logger.error('update failed: [model:' + that.name + ']', that.data, error);
			that.rollback();
			return cb(error);
		}
		logger.info('data updated', that.name, that.data);
		cb(null, result);
	});
};

Model.prototype.delete = function (cb) {
	if (!this.loaded) {
		return cb(new ModelError('noDataToDelete', 'data must be either created or read before delete: ' + this.name));
	}
	var that = this;
	this.driver.delete(this.name, this.getId(), function (error, result) {
		if (error) {
			logger.error('delete failed: [model:' + that.name + ']', error);
			return cb(error);
		}
		logger.info('data deleted', that.name, that.data);
		that.data = {};
		that.backup = {};
		that.loaded = false;
		cb(null, result);
	});
};

Model.prototype.rollback = function () {
	for (var name in this.backup) {
		this.data[name] = this.backup[name];
	}
	this.backup = {};
};

Model.prototype.formatData = function () {
	var keys = Object.keys(this.constraints);
	if (!keys.length) {
		return new ModelError('modelConstraintsNotDefined', 'model constraints must be defined: ' + this.name);
	}
	// apply default values
	for (var name in this.constraints) {
		if (!this.data.hasOwnProperty(name)) {
			this.data[name] = this.constraints[name].default;
			this.backup[name] = this.constraints[name].default;
		}
	}
};

Model.prototype.setProtectedProperties = function () {
	this.data.__id = uuid.v4();
	this.data.created = Date.now();
	this.data.modified = this.data.created;
	this.backup.__id = this.data.__id;
	this.backup.created = this.data.created;
	this.backup.modified = this.data.modified;
};

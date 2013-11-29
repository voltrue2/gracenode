
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var gracenode = require('../../');
var log = gracenode.log.create('data');

// used for Obj class
var propTypes = ['number', 'string', 'object', 'Obj', 'boolean', 'TimeNumber'];

/*******************************************************
what is it?:
data module lets you define and enforce data object schema
*******************************************************/

module.exports.TimedNumber = TimedNumber;

// create a new Data object
module.exports.create = function () {
	return new Data();
};

/*************************
TimedNumber object class
*************************/
/*
props = {
	min: number, // allowed min value
	max: number, // allowed max value
	value: number, // current value
	interval: number, // update interval in milliseconds
	updateStep: number // update value per interval
};
*/
function TimedNumber(props) {
	EventEmitter.call(this);
	this._props = null;
	this.setProperties(props);
}

util.inherits(TimedNumber, EventEmitter);

TimedNumber.prototype.getValue = function () {
	var val = this._props.value;
	var now = Date.now();
	var diff = now - this._props.lastUpdated;
	var steps = Math.floor(diff / this._props.interval) * this._props.updateStep;
	return Math.min(val + steps, this._props.max);
};

TimedNumber.prototype.getNextUpdateTime = function () {
	var timeLeftTilNextUpdate = (Date.now() - this._props.lastUpdated) % this._props.interval;
	return timeLeftTilNextUpdate;
};

TimedNumber.prototype.getInterval = function () {
	return this._props.interval;
};

TimedNumber.prototype.getUpdateStep = function () {
	return this._props.updateStep;
};

TimedNumber.prototype.getProperties = function () {
	return gracenode.lib.cloneObj(this._props);
};

TimedNumber.prototype.setValue = function (val) {
	this._props.value = Math.min(Math.max(val, this._props.min), this._props.max);
	this._props.lastUpdated = Date.now();
	this.emit('setValue', this._props.value, this._props.lastUpdated);
};

// set/update properties
TimedNumber.prototype.setProperties = function (props) {
	if (!props && props.min === undefined || props.max === undefined || props.min > props.max || props.value < props.min || props.value > props.max || props.interval === undefined || props.updateStep === undefined) {
		throw new Error('invalid properties for TimedNumber object:\n' + JSON.stringify(props, null, 4));
	}
	this._props = props;
	// set the last updated time in milliseconds
	this._props.lastUpdated = Date.now();
	this.emit('setProperties', gracenode.lib.cloneObj(this._props));
};

/*************************
Data object class
*************************/
function Data(properties) {
	EventEmitter.call(this);
	// import raw properties from somewhere such as database as an option
	this._props = properties || null;
}

util.inherits(Data, EventEmitter);

/*
schema: {
	'prop name': { 
		type: 'number' or 'string' or 'object', 
		size: { min: 'number', max: 'number' } // size is optional, 
		default: 'default value' // default is optional 
	}, {...}
}
*/
Data.prototype.define = function (schema) {
	// very basic sanity check
	if (this._props) {
		this.emmit('error.define');
		log.error('properties already defined');
		return false;
	}
	this._props = {};
	for (var propName in schema) {
		var prop = schema[propName];
		if (!prop.type || propTypes.indexOf(prop.type) === -1) {
			this.emit('error.define', propName, prop);
			log.error('invalid schema definition:\n' + JSON.stringify(prop, null, 4));
			return false;
		}
		if (prop.size) {
			if (prop.size.min > prop.size.max) {
				this.emit('error.define', propName, prop);
				log.error('min size cannot be bigger than max size:\n' + JSON.stringify(prop, null, 4));
				return false;
			}
		}
		if (prop.default !== undefined) {
			if (typeof prop.default !== prop.type) {
				this.emit('error.define', propName, prop);
				log.error('default data type does not match the property type: expected "' + (prop.type) + '", but given "' + (typeof prop.default) + '"');
				return false;
			}
		}
		this._props[propName] = prop;
	}
	return true;
};

Data.prototype.get = function (propName) {
	if (this._props[propName] !== undefined) {
		var prop = this._props[propName];
		switch (typeof prop) {
			case 'number':
				return this._getValueOf(prop, 0);
			case 'string':
				return this._getValueOf(prop, '');
			case 'boolean':
				return this._getValueOf(prop, false);
			case 'object':
				return this._getValueOf(prop, null);
			default:
				return null;
		}
	}
	return null;
};

// get the raw property objects to be stored somewhere such as database
Data.prototype.getProperties = function () {
	return gracenode.lib.cloneObj(this._props);
};

Data.prototype.set = function (propName, value) {
	if (this._props[propName] !== undefined && typeof value === this._props[propName].type) {
		if (this._props[propName].size) {
			var pass = evaluateSize(this._props[propName].size, value);
			if (!pass) {
				this.emit('error.set', propName, value);
				return false;
			}	
		}
		this._props[propName].value = value;
		this.emit('set', propName, value);
		return true;
	}
	this.emit('error.set', propName, value);
	return false;
};

/*
propMap = { 'prop name': 'prop value' ... };
*/
Data.prototype.setMany = function (propMap) {
	for (var propName in propMap) {
		var success = this.set(propName, propMap[propName]);
		if (!success) {
			this.emit('error.setMany', propName, propMap[propName]);
			return false;
		}
	}
	this.emit('setMany', propMap);
	return true;
};

// private
Data.prototype._getValueOf = function (prop, def) {
	if (prop.value === undefined) {
		return prop.default !== undefined ? prop.default : def;
	}
	return gracenode.lib.cloneObj(prop.value);
};

function evaluateSize(size, value) {
	var valueSize = null;
	switch (typeof value) {
		case 'number':
			valueSize = value;
			break;
		case 'string':
			valueSize = value.length;
			break;
		case 'object':
			if (Array.isArray(value)) {
				valueSize = value.length;
			}
			break;
		default:
			break;
	}
	if (valueSize === null) {
		// we do not evaludate the size
		return true;
	}
	return valueSize >= size.min && valueSize <= size.max;
}

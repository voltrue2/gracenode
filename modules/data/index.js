
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var gracenode = require('../../');
var log = gracenode.log.create('data');

// constant
module.exports.NUMBER = 'number';
module.exports.STRING = 'string';
module.exports.OBJECT = 'object';
module.exports.BOOLEAN = 'boolean';
module.exports.TIMEDNUMBER = 'timedNumber';

// used in Data class
var propTypes = [
	module.exports.NUMBER,
	module.exports.STRING,
	module.exports.OBJECT,
	module.exports.BOOLEAN,
	module.exports.TIMEDNUMBER
];


/*******************************************************
what is it?:
data module lets you define and enforce data object schema
*******************************************************/

module.exports.TimedNumber = TimedNumber;

// create a new Data object
module.exports.create = function (properties) {
	return new Data(properties);
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
	var timeLeftTilNextUpdate = Math.max(0, this._props.interval - (Date.now() - this._props.lastUpdated));
	return timeLeftTilNextUpdate;
};

TimedNumber.prototype.getMinValue = function () {
	return this._props.min;
};

TimedNumber.prototype.getMaxValue = function () {
	return this._props.max;
};

TimedNumber.prototype.getInterval = function () {
	return this._props.interval;
};

TimedNumber.prototype.getUpdateStep = function () {
	return this._props.updateStep;
};

// get properties to be stored
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
	if (!this._props.lastUpdated) {
		this._props.lastUpdated = Date.now();
	}
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
		this.emit('error.define');
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
			if (prop.type !== module.exports.TIMEDNUMBER && typeof prop.default !== prop.type) {
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
		var propType = prop.type;
		switch (propType) {
			case module.exports.NUMBER:
				return this._getValueOf(prop, 0);
			case module.exports.STRING:
				return this._getValueOf(prop, '');
			case module.exports.BOOLEAN:
				return this._getValueOf(prop, false);
			case module.exports.OBJECT:
				return this._getValueOf(prop, null);
			case module.exports.TIMEDNUMBER:
				var val = this._getValueOf(prop, null);
				if (val) {
					return new TimedNumber(val);
				}
				return null;
			default:
				return null;
		}
	}
	return null;
};

Data.prototype.getAll = function () {
	var res = {};
	for (var name in this._props) {
		res[name] = this.get(name);
	}
	return res;
};

// get the raw property objects to be stored somewhere such as database
Data.prototype.getProperties = function () {
	return gracenode.lib.cloneObj(this._props);
};

Data.prototype.set = function (propName, value) {
	// timed number object is an exception
	if (this._props[propName] !== undefined && this._props[propName].type === module.exports.TIMEDNUMBER) {
		value = value.getProperties();
		this._props[propName].value = value;
		this.emit('set', propName, value);
		return true;
	}

	if (this._props[propName] !== undefined && typeof value === this._props[propName].type) {
		if (this._props[propName].size) {
			var pass = evaluateSize(this._props[propName].size, value);
			if (!pass) {
				log.error('set "' + propName + '" failed with invalid value size: allowed between ' + JSON.stringify(this._props[propName].size) + ' > given: ' + value);
				this.emit('error.set', propName, value);
				return false;
			}	
		}
		this._props[propName].value = value;
		this.emit('set', propName, value);
		return true;
	}
	log.error('set "' + propName + '" failed with invalid value: ' + value + '(' + (typeof value) + ') > expected type: ' + this._props[propName].type);
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

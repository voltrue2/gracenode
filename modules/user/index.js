/*
 * Required properties
 * id: Number/String
 * lv: Number
 * name: String
 * xp: { initVal: number, current: Number, max: Number/null, growth: Function(editable from config file) }
 * sc: Number (soft currency)
 * hc: Number (hard currency)
 * maxNameLen: Number
 *
 * Editable properties
 *
 *	properties: {
 *		propName: {
 *			initVal: Number/String/Object,
 *			growth: String/null, // function name written in user/formula.js or null
 *			maxVal: Number/null,
 *			state: { // or null 
 *				currentVal: Number, // current value of the property
 *				interval: Number, // recovery interval in miliseconds
 *				step: Number, // recovery value per interval     
 *				maxVal: Number, // max value of the property
 *				lastUpdated: Number // last updated unixtimestamp
 *			}
 *		}
 *  }
 * */

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var formula = require('./formula.js');
var propDef = null;
var confDef = null;

var gracenode = require('../../');
var log = gracenode.log.create('user');

module.exports.readConfig = function (config) {
	if (!config || !config.properties || !config.maxNameLen) {
		return new Error('invalid configuration given: \n' + JSON.stringify(config, null, 4));
	}
	propDef = config.properties;
	confDef = {
		maxNameLen: config.maxNameLen
	};
	return true;
};

module.exports.getUserById = function (id, cb) {
	// this is user from somewhere else
	var props = {
		id: id,
		lv: 1,
		name: 'Test User',
		sc: 100,
		hc: 0,
		xp: { initVal: 10, current: 0, max: 10, growth: 'simple' },
		properties: {
			energy: { initVal: 10, growth: 'every3Lv', maxVal: null,
					state: {
						currentVal: 10, interval: 30000, step: 1, maxVal: 10, lastUpdated: 0 
					}
			},
			points: { initVal: 0, growth: 'every2Lv', maxVal: null }
		}
	}; // from DB
	
	cb(new User(JSON.stringify(props)));
};

module.exports.getUsersByIds = function (idList, cb) {
	
};

module.exports.saveUser = function (user, cb) {

};

module.exports.saveUsers = function (userList, cb) {

};

function User(userProps) {
	if (!userProps) {
		return new Error('invalid user properties or configuration', userProps);
	}
	this._props = JSON.parse(userProps);
	if (!this._props.id || !this._props.lv || !this._props.name || !this._props.xp) {
		return new Error('invalid user data: missing required properties', this._props);
	}
	EventEmitter.call(this);
	this._conf = confDef;
}

util.inherits(User, EventEmitter);

User.prototype.getLv = function () {
	return this._props.lv;
};

User.prototype.getName = function () {
	return this._props.name;
};

User.prototype.getSc = function () {
	return this._props.sc;
};

User.prototype.getHc = function () {
	return this._props.hc;
};

User.prototype.getXp = function () {
	return this._props.xp.current;
};

User.prototype.getMaxXp = function () {
	return this._props.xp.max;
};

User.prototype.get = function (propName) {
	var props = this._props.properties;
	if (props && props[propName] !== undefined) {
		if (props[propName].state) {
			// dynamic property with state
			return calcState(this.getLv(), props[propName]);
		}
		// static property without state
		return formula.calc(this.getLv(), props[propName]);
	}
	return null;
};

// dynamic properties with state object only
User.prototype.getState = function (propName) {
	var props = this._props.properties;
	if (props && props[propName] && props[propName].state) {
		var propState = props[propName].state;
		var state = {
			currentVal: propState.currentVal,
			interval: propState.interval,
			step: propState.step,
			maxVal: propState.maxVal,
			lastUpdated: propState.lastUpdated
		};
		return state;
	}
	return null;
};

// dynamic properties with state object only
User.prototype.setState = function (propName, propState) {
	var props = this._props.properties;
	if (props && props[propName] !== undefined) {
		if (props[propName].state && validateState(propState)) {
			for (var key in props[propName].state) {
				if (propState[key] !== undefined) {
					props[propName].state[key] = propState[key];
				}
			}
			this.emit('setState', propName);
			return true;
		}
	}
	return false;
};

User.prototype.setName = function (value) {
	if (typeof this._props.name === typeof value) {
		if (value.length <= this._conf.maxNameLen) {
			this._props.name = value;
			this.emit('setName', value);
			return true;
		}
	}
	return false;
};

User.prototype.setSc = function (value) {
	if (typeof this._props.sc === typeof value && value >= 0) {
		this._props.sc = value;
		this.emit('setSc', value);
		return true;
	}
	return false;
};

User.prototype.setHc = function (value) {
	if (typeof this._props.hc === typeof value && value >= 0) {
		this._props.hc = value;
		this.emit('setHc', value);
		return true;
	}
	return false;
};

User.prototype.setXp = function (value) {
	if (typeof this._props.xp.current === typeof value) {
		// update current xp
		this._props.xp.current += value;
		var diff = this._props.xp.current - this._props.xp.max;
		if (diff >= 0) {
			// level up
			this._props.lv += 1;
			// update current xp
			this._props.xp.current = 0;
			// update max xp for next level up
			this._props.xp.max = formula.calc(this._props.lv, this._props.xp);
			// update dynamic properties with state
			for (var propName in this._props.properties) {
				var prop = this._props.properties[propName];
				if (prop.state) {
					prop.state.maxVal = formula.calc(this._props.lv, prop);
					prop.state.currentVal = prop.state.maxVal;
				}
			}
			// check for more level up
			if (diff > 0) {
				return this.setXp(diff);
			}
		}
		this.emit('setXp', value);
		return true;
	}
	return false;
};

// dynamic properties with state object only
User.prototype.set = function (propName, value) {
	var props = this._props.properties;
	if (props && props[propName] === undefined  || !props[propName].state) {
		// prop does not exist
		return false;
	}
	// validate data type
	if (typeof value !== typeof this.get(propName)) {
		// data type does not match
		return false;
	}
	if (value < 0) {
		// negative value not allowed
		return false;
	}
	if (props[propName].state) {
		// update value
		props[propName].state.currentVal = value;
		// update state
		props[propName].state.lastUpdated = Date.now();
	}
	this.emit('set.' + propName, value);
	return true;
};

function validateState(state) {
	if (state.currentVal !== undefined) {
		if (isNaN(state.currentVal) || state.currentVal < 0) {
			return false;
		}
	}
	if (state.interval !== undefined) {
		if (isNaN(state.interval) || state.interval < 0) {
			return false;
		}
	}
	if (state.step !== undefined) {
		if (isNaN(state.step) || state.step <= 0) {
			return false;
		}
	}
	if (state.maxVal !== undefined) {
		if (isNaN(state.maxVal) || state.maxVal <= 0) {
			return false;
		}
	}
	if (state.lastUpdated !== undefined) {
		if (isNaN(state.lastUpdated) || state.lastUpdated < 0) {
			return false;
		}
	}
	return true;
}

function calcState(lv, prop) {
	var state = prop.state;
	var now = Date.now();
	var diff = now - state.lastUpdated;
	var steps = Math.floor(diff / state.interval);
	return Math.min(state.currentVal + (state.step * steps), state.maxVal);
}

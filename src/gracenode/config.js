'use strict';

const gn = require('../gracenode/');
var config = {};

exports.load = load;
exports.get = get;

/////////////////////////////


/**
* ///////////////////////
* // Internal use only //
* ///////////////////////
*/

exports.dump = dump;
exports.restore = restore;

/////////////////////////////


/**
* ///////////////////////
* // Public Functions  //
* ///////////////////////
*/

/** @description Sets configurations
* @params {object} configObj - Configuration object
*/
function load(configObj) {
	for (var i in configObj) {
		if (!config.hasOwnProperty(i)) {
			config[i] = configObj[i];
		} else {
			config[i] = merge(i, config, configObj);
		}
	}
}

/** @description Internal use only configuration data dump
* @returns {object}
*/
function dump() {
	return JSON.stringify(config);
}

/** @description Internal use only function
*	to restore modified configurations
* @params {string} stringified
*	- Stringified configurations to restore with
* @returns {undefined}
*/
function restore(stringified) {
	config = JSON.parse(stringified);
}

/** @description Returns configuration object
* @params {string} propName
*	- Property name of the configurations:
*	Dot notation is supported for sub properties
* @returns {any}
*/
function get(propName) {
	if (!propName) {
		return gn.lib.cloneObj(config);
	}
	var propNames = [];
	if (propName.indexOf('.') !== -1) {
		// split it by period
		propNames = propName.split('.');
	} else {
		propNames.push(propName);
	}
	// this is to indicate if we found a match
	// of configurations at least once or not
	// if found is false, we return null
	var found = false;
	var conf = gn.lib.cloneObj(config);
	for (var i = 0, len = propNames.length; i < len; i++) {
		var prop = propNames[i];
		if (conf[prop] !== undefined) {
			conf = conf[prop];
			found = true;
		} else {
			// if the configurations you are looking for
			// is not found, return null
			conf = null;
			break;
		}
	}
	if (!found) {
		conf = null;
	}
	return conf;
}


/////////////////////////////

/**
* ///////////////////////
* // Private Functions //
* ///////////////////////
*/

function merge(key, origin, obj) {
	if (typeof origin[key] === 'object' && typeof obj[key] === 'object') {
		if (Array.isArray(origin[key]) && Array.isArray(obj[key])) {
			origin[key] = origin[key].concat(obj[key]);
		} else {
			for (var i in obj[key]) {
				origin[key][i] = merge(i, origin[key], obj[key]);
			}
		}
	} else {
		origin[key] = obj[key]; 
	}
	return origin[key];
}

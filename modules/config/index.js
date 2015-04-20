'use strict';

var fs = require('fs');
var jshint = require('jshint').JSHINT;
var configPath;
var configFiles = [];
var configData = {};

/**
 * Set the path for loading configuration file(s)
 * @param {string} file system path to config file(s) directory
 *
 */
module.exports.setPath = function (path) {
	configPath = path;
};

/**
 * Load configuration file(s)
 * @param {array} a list of configuration file name(s) to load
 * @param {function} callback
 */
module.exports.load = function (configList) {
	if (configPath === undefined) {
		return new Error(
			'configPath has not been set. ' +
			'you must call setConfigPath() method before calling gracenode.setup()'
		);
	}
	for (var i = 0, len = configList.length; i < len; i++) {
		configFiles.push(configPath + configList[i]);
		var error = parseConfigData(configList[i]);
		if (error) {
			return error;
		}
	}
	return false;
};

// returns an array of loaded config files for logging
module.exports.getConfigFiles = function () {
	return configFiles;
};

/**
* Dynamically sets configuration value(s). Use this with caution...
* @param {string} property name of configuration value(s). can be period separated
* @param {mix} value(s) of a configuration property
**/
module.exports.set = function (key, values) {
	var keys = key.split('.');
	var config = configData;
	var prop = keys.shift();
	// we stop traversing before at the last item in keys array
	while (keys.length >= 1) {
		config = config[prop];
		prop = keys.shift();
	}
	// now we use the last prop from keys array and set the config value
	config[prop] = values;
};

/** 
* Returns the whole configuration object 
**/
module.exports.getAll = function () {
	return configData;
};

/**
 * Return the value of configuration property
 * @param {string} property name of a configuration value, can be period separated
 * */
module.exports.getOne = function (propName) {
	var propNames = [];
	if (propName.indexOf('.') !== -1) {
		// split it by period
		propNames = propName.split('.');
	} else {
		propNames.push(propName);
	}
	// this is to indicate if we found a match of configurations at least once or not
	// if found is false, we return null
	var found = false;
	var conf = configData;
	for (var i = 0, len = propNames.length; i < len; i++) {
		var prop = propNames[i];
		if (conf[prop] !== undefined) {
			conf = conf[prop];
			found = true;
		} else {
			// if the configurations you are looking for is not found, return null
			conf = null;
			break;
		}
	}
	if (!found) {
		conf = null;
	}
	return conf;
};

module.exports.getMany = function (propNameList) {
	var res = {};
	for (var i = 0, len = propNameList.length; i < len; i++) {
		var propName = propNameList[i];
		res[propName] = module.exports.getOne(propName);
	}
	return res;
};

function parseConfigData(filePath) {
	var path = configPath + filePath;
	var config;
	try {
		config = require(path);
	} catch (e) {
		// get more details of the problem
		var data = fs.readFileSync(path, { encoding: 'utf8' });
		lintConfig(path, data);
		return e;
	}
	for (var key in config) {
		if (typeof config[key] !== 'object') {
			configData[key] = config[key];
			continue;
		}
		if (configData[key] === undefined) {
			configData[key] = {};
		}
		for (var prop in config[key]) {
			configData[key][prop] = config[key][prop];
		}
	}
	return false;
}

function lintConfig(path, data) {
	if (data) {
		if (!jshint(data)) {
			// there is a lint error
			var errors = jshint.data().errors;
			if (errors.length) {
				console.error('[Error] malformed configuration(s) detected in', path);
			}
			for (var i = 0, len = errors.length; i < len; i++) {
				console.error(
					'    *** configuration [error] Line', 
					errors[i].line, 
					'Character',
					errors[i].character,
					errors[i].reason
				);
			}
		}	
	}
}

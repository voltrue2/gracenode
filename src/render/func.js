'use strict';

var FUNC = /\((.*?)\)/;
var map = {};

exports.add = function __renderFuncAdd(name, func) {
	if (typeof func !== 'function') {
		throw new Error('CannotRegisterNonFunction: ' + name);
	}
	map[name] = func;
};

// if the variable is using registered function, find it
exports.getFunc = function __renderFuncGetFunc(value) {
	var match = value.match(FUNC);
	if (match) {
		var name = value.replace(match[0], '');
		if (!map[name]) {
			return null;
		}
		return { func: map[name], value: match[1] } || null;
	}
	// function is being used
	return null;
};

'use strict';

var gn = require('../gracenode');
var hooks = require('./hooks');
var mapping = require('./mapping');

var logger;

exports.setup = function () {
	logger = gn.log.create('HTTP.route');
	mapping.setup();
	hooks.setup();
};

exports.define = function (method, path, handler, opt) {
	if (typeof handler !== 'function') {
		throw new Error(
			'InvalidRouteHandler: ' +
			method + ' ' + path +
			' [' + (typeof handler) + ']'
		);		
	}
	mapping.add(method, path, handler, opt);
};

exports.hook = function (path, handler) {
	mapping.hook(path, handler);
};

exports.find = function (method, fullpath) {
	// head is treated as get
	method = method === 'HEAD' ? 'GET' : method;
	// extract path
	var queryIndex = fullpath.indexOf('?');
	var queryList = [];
	var path = fullpath;
	if (queryIndex !== -1) {
		queryList = fullpath.substring(queryIndex + 1).split('&');
		path = fullpath.substring(0, queryIndex);
	}
	var res = mapping.getRoute(method, path);
	if (!res) {
		return null;
	}
	// parameters
	var paramList = getParamList(res.matched);
	// create found object
	return {
		path: res.route.path,
		query: parseQuery(queryList),
		params: parseParams(paramList, res.route.paramNames),
		handler: res.route.handler,
		hooks: res.route.hooks,
		readBody: res.route.readBody
	};
};

function getParamList(matched) {
	var list = [];
	var j = 0;
	for (var i = 1, len = matched.length; i < len; i++) {
		if (matched[i] !== undefined) {
			list[j] = matched[i];
			j++;
		}
	}
	return list;
}

function parseQuery(list) {
	var query = {};
	for (var i = 0, len = list.length; i < len; i++) {
		var sep = list[i].split('=');
		query[sep[0]] = typecast(sep[1]);
	}
	return query;
}

function parseParams(list, names) {
	var params = {};
	for (var i = 0, len = names.length; i < len; i++) {
		var item = names[i];
		var value = list[i];
		params[item.name] = cast(item.type, value);
	}
	return params;
}

function typecast(value) {
	var val = decodeURI(value);
	if (isNaN(val)) {
		switch (val) {
			case 'true':
			case 'TRUE':
			case 'True':
				return true;
			case 'false':
			case 'FALSE':
			case 'False':
				return false;
			case 'null':
			case 'NULL':
			case 'Null':
				return null;
			case 'undefined':
			case 'UNDEFINED':
			case 'Undefined':
				return undefined;
			default:
				try {
					// object
					return JSON.parse(val);
				} catch (e) {
					// string
					return val;
				}
		}
	}
	// numeric
	return parseFloat(val, 10);
}

function cast(type, value) {
	var val = decodeURI(value);
	switch (type) {
		case 'number':
			if (isNaN(val)) {
				throw new Error('InvalidNumber: ' + val);
			}
			return parseFloat(val, 10);
		case 'bool':
			var bool = val.toLowerCase();
			if (bool !== 'true' && bool !== 'false') {
				throw new Error('InvalidBool: ' + val);
			}
			return bool === 'true' ? true : false;
		case 'object':
			return JSON.parse(val);
		default:
			if (type instanceof RegExp) {
				// data type is regex
				var pass = type.test(val);
				if (!pass) {
					throw Error('InvalidParameterTypeByRegExp: ' + val);
				}
			}
			// string
			return val;
	}
}


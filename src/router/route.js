'use strict';

var gn = require('../gracenode');
var url = require('./url');
var hooks = require('./hooks');

var logger;

var PARAM_NAME_REGEX = /{(.*?)}/g;
var PARAM_REGEX = /\/{(.*?)}/g;
var BRACE_REGEX = /({|})/g;
var TYPES = [
	'string',
	'number',
	'bool',
	'object'
];

var routes = {
	GET: [],
	POST: [],
	PUT: [],
	DELETE: [],
	PATCH: []
};

exports.setup = function () {
	logger = gn.log.create('router.route');
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
	// head is treated as get
	method = method === 'HEAD' ? 'GET' : method;
	// options
	opt = opt || { readBody: false, sensitive: false };
	// read request body option
	if (method !== 'GET' && !opt.readBody) {
		opt.readBody = true;
	}
	// case sensitivity option: default is insensitive
	if (opt.sensitive) {
		opt.sensitive = true;
	}
	// convert path to regex
	var converted = url.convert(path, opt.sensitive || false);
	// create search regex
	if (opt.sensitive) {
		regex = new RegExp(converted.pmatch);
	} else {
		regex = new RegExp(converted.pmatch, 'i');
	}
	var regex;
	// add it to routes
	routes[method].push({
		path: path.replace(PARAM_REGEX, ''),
		pattern: converted.pmatch,
		regex: regex,
		extract: converted.extract,
		paramNames: getParamNames(path),
		handler: handler,
		hooks: hooks.findHooks(path),
		readBody: opt.readBody
	});	
	// sort the order of routes long uri to short uri
	routes[method].sort(function (a, b) {
		return b.pattern.length - a.pattern.length;
	});
};

exports.hook = function (path, handler) {
	hooks.hook(path, handler);
	hooks.updateHooks(routes);
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
	// search
	var res = searchRoute(method, path);
	if (!res) {
		return null;
	}
	// parameters
	var paramList = getParamList(res.matched);
	// create found object
	var found = {
		path: res.route.path,
		query: parseQuery(queryList),
		params: parseParams(paramList, res.route.paramNames),
		handler: res.route.handler,
		hooks: res.route.hooks,
		readBody: res.route.readBody
	};
	// done and return
	return found;
};

function searchRoute(method, path) {
	var list = routes[method] || [];
	for (var i = 0, len = list.length; i < len; i++) {
		var item = list[i];
		var found = item.regex.test(path);
		if (found) {
			return {
				matched: item.extract.exec(path),
				route: item
			};
		} 
	}
	return null;
}

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

function getParamNames(path) {
	var list = path.match(PARAM_NAME_REGEX);
	if (list) {
		var res = [];
		for (var i = 0, len = list.length; i < len; i++) {
			var sep = list[i].replace(BRACE_REGEX, '').split(':');
			var type;
			var name;
			if (sep.length === 2) {
				type = sep[0];
				if (TYPES.indexOf(type) === -1) {
					throw new Error('InvalidType: ' + type);
				}
				name = sep[1];
			} else {
				type = null;
				name = sep[0];
			}
			res.push({
				type: type,
				name: name
			});
		}
		return res;
	}
	return [];
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
			// string
			return val;
	}
}


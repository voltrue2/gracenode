'use strict';

var url = require('./url');
var hooks = require('./hooks');
var gn = require('../gracenode');
var logger;

const PARAM_NAME_REGEX = /{(.*?)}/g;
const PARAM_REGEX = /\/{(.*?)}/g;
const BRACE_REGEX = /({|})/g;
const TYPES = [
	'string',
	'number',
	'bool',
	'object',
	'static'
];

// routes (shortcuts) with named parameters
var routes = {
	GET: {},
	POST: {},
	PUT: {},
	DELETE: {},
	PATCH: {}
};

// all routes with named parameters
var allroutes = {
	GET: [],
	POST: [],
	PUT: [],
	DELETE: [],
	PATCH: []
};

// routes without named parameters
var fastroutes = {
	GET: {},
	POST: {},
	PUT: {},
	DELETE: {},
	PATCH: {}
};

exports.setup = function __mappingSetup() {
	logger = gn.log.create('HTTP.mapping');
};

exports.hook = function __mappingHook(path, handler) {
	hooks.hook(path, handler);
	hooks.updateHooks(fastroutes, routes, allroutes);
};

exports.add = function __mappingAdd(method, path, handler, opt) {
	// head is treated as get
	method = method === 'HEAD' ? 'GET' : method;
	// always leading slash
	if (path[0] !== '/') {
		path = '/' + path;
	}
	// no trailing slash
	if (path.length > 1 && path[path.length - 1] === '/') {
		path = path.substring(0, path.length - 1);
	}
	// option defaults
	opt = opt || {
		readBody: method !== 'GET' ? true : false,
		sensitive: false
	};
	// convert path to regex
	var converted = url.convert(path, opt.sensitive);
	// fast route w/o named parameters
	if (converted.fast) {
		return addToFastRoutes(method, path, handler, opt);
	}
	// route w/ named parameters
	addToRoutes(method, path, handler, opt, converted);
};

exports.getRoute = function __mappingGetRoute(method, path) {
	// try fast route first
	var fast = searchFastRoute(method, path);
	if (fast) {
		return {
			matched: [],
			route: {
				path: fast.path,
				paramNames: [],
				handlers: fast.handlers,
				hooks: fast.hooks,
				readBody: fast.readBody,
				sensitive: fast.sensitive
			}
		};
	}
	// try routes
	var found = searchRoute(method, path);
	if (!found || !found.matched) {
		return null;
	}
	return found;
};

function addToFastRoutes(method, path, handler, opt) {
	const key = !opt.sensitive ? path.toLowerCase() : path;
	if (fastroutes[method][key]) {
		fastroutes[method][key].handlers.push(handler);
		return;
	}
	fastroutes[method][key] = {
		path: path,
		paramNames: null,
		handlers: [ handler ],
		hooks: hooks.findHooks(path),
		readBody: opt.readBody,
		sensitive: opt.sensitive
	};
}

function addToRoutes(method, path, handler, opt, conv) {
	// add to routes
	const key = getRouteKey(path);
	if (!routes[method][key]) {
		routes[method][key] = [];
	}
	const lkey = key.toLowerCase();
	if (!routes[method][lkey]) {
		routes[method][lkey] = [];
	}
	// try to see if there's a same path already registered
	if (routes[method][key].length) {
		// since javascript passes around reference to route route object,
		// do alone will update for lowercase and all routes
		const success = updateDupRegistry(
			routes[method][key],
			method,
			path,
			key,
			handler
		);
		if (success) {
			return;
		}
	}
	var regex = opt.sensitive ? new RegExp(conv.pmatch) : new RegExp(conv.pmatch, 'i');
	var route = {
		path: path.replace(PARAM_REGEX, ''),
		pattern: conv.pmatch,
		regex: regex,
		extract: conv.extract,
		paramNames: getParamNames(path),
		handlers: [ handler ],
		hooks: hooks.findHooks(path),
		readBody: opt.readBody
	};
	routes[method][key].push(route);
	// re-order route list from long uri to short uri
	routes[method][key].sort(function __mappingAddToRoutesRoutesSort(a, b) {
		return b.pattern.length - a.pattern.length;
	});
	routes[method][lkey] = routes[method][key];
	// add the route to all routes also
	allroutes[method].push(route);
	// re-order all routes
	allroutes[method].sort(function __mappingAddToRoutesAllRoutesSort(a, b) {
		return b.pattern.length - a.pattern.length;
	});
}

function updateDupRegistry(list, method, path, key, handler) {
	const regPath = path.replace(PARAM_REGEX, '');
	for (var i = 0, len = list.length; i < len; i++) {
		var item = list[i];
		if (item.path === regPath) {
			list[i].handlers.push(handler);
			return true;
		}
	}
	return false;
}

function searchFastRoute(method, path) {
	if (path === '/' && fastroutes[method]) {
		return fastroutes[method][path] || null;
	}
	if (path[path.length - 1] === '/') {
		path = path.substring(0, path.length - 1);
	}
	var map = fastroutes[method] || {};
	// try case sensitive
	if (map[path]) {
		return map[path];
	}
	// try case insensitive
	const lpath = path.toLowerCase();
	var match = map[lpath];
	if (match && match.sensitive) {
		return null;
	}
	return match;
}

function searchRoute(method, path) {
	if (!routes[method]) {
		logger.error(method, 'not supported');
		return null;
	}
	const key = getRouteKey(path);
	var list = routes[method][key];
	if (!list) {
		return searchAllRoutes(method, path);
	}
	var found = searchRouteShortcut(path, list);
	if (!found) {
		logger.verbose('Route not found for:', path, 'in', list);
		return null;
	}
	return found;
}

function searchRouteShortcut(path, list) {
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

function searchAllRoutes(method, path) {
	var list = allroutes[method];
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

function getRouteKey(path) {
	var key = path.substring(1);
	return key.substring(0, key.indexOf('/'));
}

function getParamNames(path) {
	var list = path.match(PARAM_NAME_REGEX);
	var res = [];
	if (list) {
		for (var i = 0, len = list.length; i < len; i++) {
			var sep = list[i].replace(BRACE_REGEX, '').split(':');
			var type;
			var name;
			if (sep.length === 2) {
				type = sep[0];
				if (TYPES.indexOf(type) === -1) {
					type = handleRegexDataType(type);
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
	}
	return res;
}

function handleRegexDataType(type) {
	try {
		// parameter data type is a regex
		// this string MUST BE a complete javascript regular expression
		// exmaple: /^[a-zA-Z]*$/g
		var regStr;
		var reg = type;
		var arg = reg.substring(reg.lastIndexOf('/') + 1) || null;
		if (arg) {
			regStr = reg.replace(arg, '').replace(/\//g, '');
			type = new RegExp(regStr, arg);
		} else {
			regStr = reg.replace(/\//g, '');
			type = new RegExp(regStr);
		}
		return type;
	} catch (e) {
		logger.error(e);
		throw new Error('InvalidType: ' + type);
	}
}

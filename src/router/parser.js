'use strict';

var gn = require('../gracenode');
var url = require('./url');
var logger;
var routes = {
	GET: [],
	POST: [],
	PUT: [],
	DELETE: [],
	PATCH: []
};
var hooks = {};

var TYPES = [
	'string',
	'number',
	'object',
	'bool'
];
var REG = {
	PARAM: /{(.*?)}/g,
	PATH: /\/{(.*?)}/g,
	SLASH: /\//g,
	HOOK: /\/{(.*?)}/g
};

exports.setup = function () {
	logger = gn.log.create('router.parser');
};

exports.define = function (method, path, handler, opt) {
	if (typeof handler !== 'function') {
		throw new Error(
			'InvalidRouteHandler: ' +
			method + ' ' + path +
			' [' + (typeof handler) + ']'
		);
	}
	opt = typeof opt === 'object' ? opt : {};
	method = (method === 'HEAD') ? 'GET' : method;
	var res = {
		handler: null,
		path: null,
		pattern: null,
		readBody: false,
		paramNames: []
	};
	var headingSlash = path[0] === '/' ? '' : '/';
	path = path[path.length - 1] === '/' ? path.substring(0, path.length - 1) : path;
	var paramNames = path.match(REG.PARAM) || [];
	for (var i = 0, len = paramNames.length; i < len; i++) {
		var param = paramNames[i].substring(1, paramNames[i].length - 1);
		var type = null;
		var name = param;
		if (param.indexOf(':') !== -1) {
			var sep = param.split(':');
			type = validateType(sep[0]);
			name = sep[1];
		}
		res.paramNames.push({
			type: type,
			name: name
		});
	}
	var converted = url.convert(headingSlash + path, opt.sensitive);
	var pattern = converted.pmatch;
	res.regex = converted.match;
	res.extract = converted.extract;
	res.pattern = pattern.replace(REG.SLASH, '\\/');
	res.path = headingSlash + path.replace(REG.PATH, '');
	res.handler = handler;
	res.readBody = method === 'GET' || method === 'HEAD' ? false : true;
	if (opt.readBody) {
		res.readBody = true;
	}
	res.hooks = findHooks(res.path);
	routes[method].push(res);
	// sort the order of routes long uri to short uri
	routes[method].sort(function (a, b) {
		return b.pattern.length - a.pattern.length;
	});
};

exports.hook = function (path, func) {
	// root exception
	if (path === '/') {
		if (!hooks.hasOwnProperty(path)) {
			hooks[path] = [];
		}
		if (Array.isArray(func)) {
			hooks[path] = hooks[path].concat(func);
		} else {
			hooks[path].push(func);
		}
		logger.verbose('HTTP request hook registed:', path, 'hooks #', hooks[path].length);
		return;
	}
	var headingSlash = path[0] === '/' ? '' : '/';
	var hookPath = headingSlash + path.replace(REG.HOOK, '');
	var len = hookPath.length - 1;
	hookPath = (hookPath[len] === '/') ? hookPath.substring(0, len) : hookPath;
	// add the hook function to exact match
	if (!hooks.hasOwnProperty(hookPath)) {
		hooks[hookPath] = [];
	}
	if (Array.isArray(func)) {
		hooks[hookPath] = hooks[hookPath].concat(func);
	} else {
		hooks[hookPath].push(func);
	}
	updateHooks();
	logger.verbose('HTTP request hook registed:', hookPath, 'hooks #', hooks[hookPath].length);
};

exports.parse = function (method, fullPath) {
	method = (method === 'HEAD') ? 'GET' : method;
	var parsed = {
		query: {},
		params: {}
	};
	var queryIndex = fullPath.indexOf('?');
	var queryList = [];
	var path = fullPath;
	if (queryIndex !== -1) {
		queryList = fullPath.substring(queryIndex + 1).split('&');
		path = fullPath.substring(0, queryIndex);
	}
	path += (path[path.length - 1] === '/') ? '' : '/';
	var list = routes[method] || [];
	var matched;
	for (var h = 0, hen = list.length; h < hen; h++) {
		var item = list[h];
		var m = item.regex.exec(path);
		if (m) {
			matched = item;
			break;
		}
	}

	if (!matched) {
		// failed to resolve
		return null;
	}
	// get request handler
	// first element is the matched string
	// discard it
	var res = matched.extract.exec(path);
	res.shift();
	parsed.path = matched.path;
	parsed.pattern = matched.pattern;
	parsed.handler = matched.handler;
	parsed.readBody = matched.readBody;
	parsed.hooks = matched.hooks;
	for (var k = 0, ken = matched.paramNames.length; k < ken; k++) {
		var type = matched.paramNames[k].type;
		var name = matched.paramNames[k].name;
		parsed.params[name] = castType(type, res[k]);
	}
	// parse request query
	for (var i = 0, len = queryList.length; i < len; i++) {
		var sep = queryList[i].split('=');
		parsed.query[sep[0]] = cast(sep[1]);
	}
	// done
	return parsed;
};

function updateHooks() {
	for (var method in routes) {
		var list = routes[method];
		for (var i = 0, len = list.length; i < len; i++) {
			var route = list[i];
			routes[method][i].hooks = findHooks(route.path);
		}
	}
}

function findHooks(reqPath) {
	var matchedHooks = [];
	for (var path in hooks) {
		if (path === '/') {
			matchedHooks = matchedHooks.concat(hooks[path]);
			continue;
		}
		var index = reqPath.indexOf(path);
		var lastChar = reqPath[path.length];
		if (index === 0 && (lastChar === '/' || lastChar === undefined)) {
			matchedHooks = matchedHooks.concat(hooks[path]);
		}
	}
	return matchedHooks;
}

function cast(value) {
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

function castType(type, value) {
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

function validateType(type) {
	if (TYPES.indexOf(type) === -1) {
		throw new Error('InvalidType: ' + type);
	}
	return type;
}

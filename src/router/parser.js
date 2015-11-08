'use strict';

var gn = require('../gracenode');
var logger = gn.log.create('router.parser');
var routes = {
	GET: [],
	POST: [],
	PUT: [],
	DELETE: [],
	PATCH: []
};
var hooks = {};

exports.define = function (method, path, handler) {
	method = (method === 'HEAD') ? 'GET' : method;
	var res = {
		handler: null,
		path: null,
		pattern: null,
		paramNames: []
	};
	var headingSlash = path[0] === '/' ? '' : '/';
	var trailingSlash = path[path.length - 1] === '/' ? '' : '/';
	var paramNames = path.match(/{(.*?)}/g) || [];
	for (var i = 0, len = paramNames.length; i < len; i++) {
		res.paramNames.push(paramNames[i].substring(1, paramNames[i].length - 1));
	}
	res.pattern = headingSlash + path.replace(/{(.*?)}/g, '(.*?)').replace(/\//g, '\\/') + trailingSlash;
	res.path = headingSlash + path.replace(/\/{(.*?)}/g, '');	
	res.handler = handler;
	routes[method].push(res);
	// sort the order of routes long uri to short uri
	routes[method].sort(function (a, b) {
		return b.pattern.length - a.pattern.length;
	});
	logger.verbose('HTTP endpoint route registered:', method, res.path, res);
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
		return;
	}
	var headingSlash = path[0] === '/' ? '' : '/';
	var hookPath = headingSlash + path.replace(/\/{(.*?)}/g, '');
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
	logger.verbose('HTTP request hook registed:', hookPath);
};

exports.parse = function (method, fullPath) {
	method = (method === 'HEAD') ? 'GET' : method;
	var parsed = {
		query: {},
		params: {}
	};
	var queryIndex = fullPath.indexOf('?');
	var queryList = (queryIndex === -1) ? [] : fullPath.substring(queryIndex + 1).split('&');
	var path = ((queryIndex === -1) ? fullPath : fullPath.substring(0, queryIndex));
	path += (path[path.length - 1] === '/') ? '' : '/';
	var list = routes[method] || [];
	var matched;
	for (var h = 0, hen = list.length; h < hen; h++) {
		var item = list[h];
		if (path.search(item.pattern) === 0) {
			matched = item;
			break;
		}
	}
	if (!matched) {
		// failed to resolve
		return null;
	}
	// get request handler
	var res = path.match(matched.pattern);
	// first element is the matched string
	// discard it
	res.shift();
	parsed.origin = decodeURI(path);
	parsed.path = matched.path;
	parsed.pattern = matched.pattern;
	parsed.handler = matched.handler;
	for (var k = 0, ken = matched.paramNames.length; k < ken; k++) {
		parsed.params[matched.paramNames[k]] = decodeURI(res[k]) || null;
	}
	// parse request query
	for (var i = 0, len = queryList.length; i < len; i++) {
		var sep = queryList[i].split('=');
		parsed.query[sep[0]] = sep[1];
	}
	// find request hooks
	parsed.hooks = findHooks(parsed.path);
	return parsed;
};

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

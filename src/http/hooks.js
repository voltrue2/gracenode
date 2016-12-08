'use strict';

var gn = require('../gracenode');

var HOOK_REG = /\/{(.*?)}/g;

var logger;
var hooks = {};

exports.setup = function __httpSetup() {
	logger = gn.log.create('HTTP.hooks');
};

exports.hook = function __httpHook(path, func) {
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
		if (logger) {
			logger.verbose('HTTP request hook registed:', path, 'hooks #', hooks[path].length);
		}
		return;
	}
	const headingSlash = path[0] === '/' ? '' : '/';
	var hookPath = headingSlash + path.replace(HOOK_REG, '');
	const len = hookPath.length - 1;
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
	if (logger) {
		logger.verbose('HTTP request hook registed:', hookPath, 'hooks #', hooks[hookPath].length);
	}
};

exports.updateHooks = function __updateHooks(fastRoutes, routes, allroutes) {
	for (var method in routes) {
		// fast routes
		var map = fastRoutes[method];
		for (var path in map) {
			fastRoutes[method][path].hooks = exports.findHooks(map[path].path);
		}
		// shortcut routes
		for (var key in routes[method]) {
			for (var j = 0, jen = routes[method][key].length; j < jen; j++) {
				routes[method][key][j].hooks = exports.findHooks(routes[method][key][j].path);
			}
		}
		// all routes
		var list = allroutes[method];
		for (var i = 0, len = list.length; i < len; i++) {
			var route = list[i];
			allroutes[method][i].hooks = exports.findHooks(route.path);
		}
	}
};

exports.findHooks = function __findHooks(key) {
	var matchedHooks = [];
	for (var path in hooks) {
		if (path === '/') {
			matchedHooks = matchedHooks.concat(hooks[path]);
			continue;
		}
		const index = key.indexOf(path);
		const lastChar = key[path.length];
		if (index === 0 && (lastChar === '/' || lastChar === undefined)) {
			matchedHooks = matchedHooks.concat(hooks[path]);
		}
	}
	return matchedHooks;
};

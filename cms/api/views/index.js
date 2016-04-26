'use strict';

var gn = require('gracenode');
var func = require('./func');
var logger;
var map = {};

module.exports.setup = function (cb) {
	logger = gn.log.create('api/views');
	var views = gn.render.getAllPaths();

	// Register all view template custom functions
	for (var name in func) {
		if (typeof func[name] === 'function') {
			gn.render.func(name, func[name]);
		}
	}

	// Register all views
	module.exports = {};
	for (var i = 0, len = views.length; i < len; i++) {
		var viewName = views[i].substring(0, views[i].lastIndexOf('.'));
		logger.verbose('Create a view:', views[i], 'as', viewName);
		map[viewName] = createView(views[i]);
	}

	cb();
};

module.exports.load = function (res, name, data) {
	if (map[name]) {
		return map[name](res, data);
	}
	logger.error(name, 'not found in defined view map');
};

function createView(name) {
	return function (res, data) {
		var rendered = gn.render(name, data || {});
		res.html(rendered);
	};
}

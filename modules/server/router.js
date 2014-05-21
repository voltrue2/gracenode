var gracenode = require('../../');
var log = gracenode.log.create('server-router');

var EventEmitter = require('events').EventEmitter;

var config = null;
var rerouteMap = {};
var controllerMap = {};

module.exports = new EventEmitter();

module.exports.readConfig = function (configIn) {
	config = configIn;
	if (config && config.reroute && config.reroute.length) {
		// create map for rerouting
		for (var i = 0, len = config.reroute.length; i < len; i++) {
			var item = config.reroute[i];
			rerouteMap[item.from] = item.to;
		}

		log.verbose('rerouting mapped:', rerouteMap);
	
	}
};

module.exports.setup = function (cb) {
	gracenode.lib.walkDir(config.controllerPath, function (error, list) {
		if (error) {
			return cb(error);
		}
		for (var i = 0, len = list.length; i < len; i++) {
			var sep = list[i].file.replace(config.controllerPath, '').split('/');
			var controller = sep[0];
			var method = sep[1].substring(0, sep[1].lastIndexOf('.'));
			if (!controllerMap[controller]) {
				controllerMap[controller] = {};
			}
			controllerMap[controller][method] = true;
		}
		log.verbose('controllers and methods mapped:', controllerMap);
		cb();
	});
};

module.exports.handle = function (url, res) {
	
	var parsedUrl = parseUrl(url);
	
	// check rerouting
	if (config.reroute) {
		// overwrite it with reroute if found
		var rerouted = handleReroute(config.reroute, parsedUrl);
		if (rerouted) {
			parsedUrl = rerouted;
		}
	}
	
	// check for ignored request
	if (config.ignored && isIgnoredRequest(config.ignored, url)) {
		
		log.verbose('request ignored:', url);

		// respond with 404 right away
		res.writeHead(404, {});
		res.end('');

		return null;
	}

	log.verbose('request resolved:', parsedUrl);

	return parsedUrl;

};

function parseUrl(url) {
	var queryIndex = url.lastIndexOf('?');
	if (queryIndex !== -1) {
		url = url.substring(0, queryIndex);
	}
	var splitted = url.split('/');
	var parsed = splitted.filter(function (item) {
		if (item !== '') {
			return item;
		}
	});

	var controller = parsed[0] || null;
	// if there is no method in URL, gracenode will look for index.js
	var method = parsed[1] || 'index';

	var notFound = null;
	
	// check the controller map
	if (!controllerMap[controller]) {
		notFound = new Error('controller ' + controller + ' not found');
	} else if (!controllerMap[controller][method]) {
		notFound = new Error('controller method ' + controller + '/' + method + ' not found');
	}

	log.verbose('controller and method found: ', controller + '/' + method);
	
	return {
		controller: controller,
		method: method,
		parameters: parsed.length > 2 ? parsed.splice(2) : [],
		originalRequest: null,
		notFound: notFound
	};
}

function handleReroute(reroute, parsedUrl) {
	var controller = parsedUrl.controller ? '/' + parsedUrl.controller : '/';
	var method = ((!parsedUrl.method || parsedUrl.method === 'index') ? '' : '/' + parsedUrl.method);
	var from = controller + method;
	if (rerouteMap[from]) {
		var rerouteTo = rerouteMap[from];
		log.verbose('rerouting: from "' + from + '" to "' + rerouteTo + '"');
		return parseUrl(rerouteTo);
	}
	// no rerouting
	return null;
}

function isIgnoredRequest(ignored, url) {
	if (Array.isArray(ignored) && ignored.indexOf(url) !== -1) {
		// ignored request detected
		return true;
	}
	return false;
}


var gracenode = require('../../../');
var log = gracenode.log.create('server-router');

var EventEmitter = require('events').EventEmitter;

var config = null;
var rerouteMap = {};

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
	// if there is no method in URL, gracenode will look for index.js
	return {
		controller: parsed[0] || null,
		method: parsed[1] || 'index',
		parameters: parsed.length > 2 ? parsed.splice(2) : [],
		originalRequest: null
	};
}

function handleReroute(reroute, parsedUrl) {
	var controller = parsedUrl.controller ? '/' + parsedUrl.controller : '/';
	var method = parsedUrl.method ? '/' + parsedUrl.method : '';
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

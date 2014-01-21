
var gracenode = require('../../../');
var log = gracenode.log.create('server-router');

var EventEmitter = require('events').EventEmitter;

var config = null;
module.exports = new EventEmitter();

module.exports.readConfig = function (configIn) {
	config = configIn;
};

module.exports.handle = function (req, res) {
	
	var parsedUrl = parseUrl(req.url);
	
	// check rerouting
	if (config.reroute) {
		// overwrite it with reroute if found
		var rerouted = handleReroute(config.reroute, parsedUrl);
		if (rerouted) {
			parsedUrl = rerouted;
		}
	}
	
	// check for ignored request
	if (config.ignored && handleIgnoredRequest(config.ignored, parsedUrl)) {
		
		log.info('request ignored:', req.url);

		this.emit('ignored', req, res);

		return;
	}

	log.verbose('request resolved:', parsedUrl);

	this.emit('handled', req, res, parsedUrl);

};

function parseUrl(url) {
	var queryIndex = url.lastIndexOf('?');
	if (queryIndex !== -1) {
		url = url.substring(0, url.lastIndexOf('?'));
	}
	var splitted = url.split('/');
	var parsed = splitted.filter(function (item) {
		if (item !== '') {
			return item;
		}
	});
	return {
		controller: parsed[0] || null,
		method: parsed[1] || null,
		args: parsed.length > 2 ? parsed.splice(2) : []
	};
}

function handleReroute(reroute, parsedUrl) {
	var controller = parsedUrl.controller ? '/' + parsedUrl.controller : '/';
	var method = parsedUrl.method ? parsedUrl.method + '/' : '';
	var from = controller + method;
	for (var i = 0, len = reroute.length; i < len; i++) {
		if (reroute[i].from === from) {
			var rerouteTo = reroute[i].to;
			// reroute
			log.verbose('rerouting: from "' + from + '" to "' + rerouteTo + '"');
			return parseUrl(rerouteTo);
		}
	}
	// no rerouting
	return null;
}

function handleIgnoredRequest(ignored, parsedUrl) {
	if (Array.isArray(ignored) && ignored.indexOf(parsedUrl.controller) !== -1) {
		// ignored request detected
		return true;
	}
	return false;
}

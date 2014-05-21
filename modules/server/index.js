
/**
 * configurations
 * {
 *		"server": {
 *			"protocol": "http" or "https",
			"pemKey": "path to pem key file", // https only
			"pemCert": "path to pem cert file", // https only
 *			"port": port number,
 *			"host": "host name or ip address",
 *			"controllerPath": "path to controller directory"
 *			"ignored": ["name of a request you want to ignore", "favicon.ico"]
 *			"error": {
				"404": { "controller": "errorControllerName", "method": "errorMethod" },
				"500"...
			},
			"reroute": [
				{ "from": "/", "to": "/another/place/" }
			]
		}
 * }
 * */

var gracenode = require('../../');
var log = gracenode.log.create('server');
var async = require('async');
var http = require('./http');
var https = require('./https');
var router = require('./router');
var controller = require('./controller');
var resource = require('./resource');
var serverError = require('./error');
var hook = require('./hook');

var EventEmitter = require('events').EventEmitter;

var config = null;
var serverEngine = null;
var server = null;

module.exports = new EventEmitter();

module.exports.readConfig = function (configIn) {
	
	config = configIn;
	
	if (config.protocol === 'https') {
		serverEngine = https;
	} else {
		serverEngine = http;
	}
	
	serverEngine.readConfig(config);
	router.readConfig(config);
	controller.readConfig(config);
	serverError.readConfig(config);
};

module.exports.setup = function (cb) {
	var list = [];
	if (config.protocol === 'https') {
		list.push(serverEngine.setup);
	}
	
	log.info('server protocol: ' + config.protocol);

	list.push(router.setup);

	async.series(list, cb);
};

/*
hooks: {
	"<controller name>": {
		"<method name>": <hook function>
	}
}
*/
// if set, controller.exec will not be invoked until requestHook is successfully executed
// use case example: session check etc
module.exports.setupRequestHooks = function (hooks) {
	log.verbose('setting up request hooks:', hooks);
	hook.setupRequestHooks(hooks);
};

module.exports.start = function () {

	log.verbose('starting server...');

	try {
		server = serverEngine.start(requestHandler);	
		//setupRequestHandler();
	} catch (exception) {
		log.fatal(exception);
	}
};

function requestHandler(request, response) {
	module.exports.emit('requestStart', request.url);

	// response module emits server.emit('requestEnd', request.url)

	// if parsedUrl returns as null, the request has been ignored
	var parsedUrl = router.handle(request.url, response);
	if (parsedUrl) {
		// create resource
		var resc = resource.create(module.exports, request, response, parsedUrl, Date.now());
		// execute controller
		controller.exec(resc);
	}
}

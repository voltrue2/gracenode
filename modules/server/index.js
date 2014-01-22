
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

var http = require('./http');
var https = require('./https');
var router = require('./router');
var controller = require('./controller');
var responser = require('./response');

var EventEmitter = require('events').EventEmitter;

var events = new EventEmitter();

var config = null;
var serverEngine = null;
var server = null;

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
};

module.exports.setup = function (cb) {
	if (config.protocol === 'https') {
		// https
		return serverEngine.setup(function (error) {
			if (error) {
				return cb(error);
			}
			controller.setup(cb);
		});
	}
	
	log.info('server protocol: ' + config.protocol);

	// http
	controller.setup(cb);
};

// event emitter
// events: requestStart, requestEnd
module.exports.events = events;

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
	controller.setupRequestHooks(hooks);
};

module.exports.start = function () {

	log.info('starting server...');

	try {
		server = serverEngine.start();	
		setupRequestHandler();
	} catch (exception) {
		log.fatal(exception);
	}
};

// request listener
function setupRequestHandler() {

	log.verbose('set up server request handlers');

	// server request listener
	server.on('request', function (request, response) {

		// start profiler		
		var profiler = gracenode.profiler.create('request: ' + request.url);
		profiler.start();

		events.emit('requestStart');

		// set up the listener on response end
		response.on('end', function () {

			events.emit('requestEnd');

			profiler.stop();
		});

		router.handle(request, response);
	});

	// router request listener
	router.on('handled', function (request, response, parsedUrl) {
		
		// set up response module to listen for exception handler and response
		responser.standby(request, response);

		controller.exec(request, response, parsedUrl);
	});
}

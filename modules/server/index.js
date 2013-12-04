
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

var EventEmitter = require('events').EventEmitter;

var config = null;
var serverEngine = null;
var server = null;
var requestHook = null;

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
	// http
	controller.setup(cb);
};

// if set, controller.exec will not be invoked until requestHook is successfully executed
// use case example: session check etc
module.exports.setRequestHook = function (cb) {
	requestHook = cb;
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
		router.handle(request, response);
	});

	// router request listener
	router.on('handled', function (request, response, parsedUrl) {
		
		if (requestHook) {

			log.verbose('request hook found');

			return requestHook(function (error) {
				
				log.verbose('request hook executed');

				if (error) {
					log.error('request hook executed with an error:', error);
					return controller.execError(request, response, parsedUrl);
				}

				log.verbose('execute controller');
				contorller.exec(request, response, parsedUrl);

			});

		}

		// there is no request hook set
		controller.exec(request, response, parsedUrl);
	
	});
}

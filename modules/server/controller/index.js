var gracenode = require('../../../');
var log = gracenode.log.create('server-controller');
var Request = require('../request');
var response = require('../response');
var fs = require('fs');

var config = null;
var controllerMap = {};
var requestHooks = null;

module.exports.readConfig = function (configIn) {
	if (!configIn || !configIn.controllerPath) {
		throw new Error('invalid configurations:\n', JSON.stringify(configIn, null, 4));
	}
	config = configIn;
};

module.exports.setup = function (cb) {
	// map all controllers and cache them in memory
	fs.readdir(config.controllerPath, function (error, dirList) {
		if (error) {
			return cb(error);
		}
		for (var i = 0, len = dirList.length; i < len; i++) {
			controllerMap[dirList[i]] = true;
			log.verbose('controller "' + dirList[i] + '" mapped');
		}
		cb();
	});
};

module.exports.setupRequestHooks = function (hooks) {
	requestHooks = hooks;
};

module.exports.exec = function (server, req, res, parsedUrl, startTime) {
	var request = new Request(req, res, parsedUrl.parameters);
	request.setup(function (error) {
		if (error) {
			return errorHandler(server, req, res, parsedUrl, null, error, 500, startTime);
		}
		handle(server, req, res, parsedUrl, request, startTime);
	});
}; 

function handle(server, req, res, parsedUrl, requestObj, startTime) {
	// path: controllerDirectory/methodFile
	var path = gracenode.getRootPath() + config.controllerPath + parsedUrl.controller + '/' + parsedUrl.method;

	try {
		if (controllerMap[parsedUrl.controller]) {
			
			log.verbose('controller "' + parsedUrl.controller + '" found');
	
			// load controller method
			var method = require(path);

			// validate request method
			if (!method[requestObj.getMethod()]) {
				var msg = requestObj.url + ' does not accept "' + requestObj.getMethod() + '"';
				return errorHandler(server, req, res, parsedUrl, requestObj, new Error(msg), 400, startTime);
			}

			// controller method
			var methodExec = method[requestObj.getMethod()];

			// create response object
			var responseObj = response.create(server, req, res, startTime);

			// override _errorHandler for responseObj.error()
			responseObj._errorHandler = function (error, status) {
				errorHandler(server, req, res, parsedUrl, requestObj, error, status, startTime);
			};

			// set up exception handler. default is true
			if (config.respondOnException || config.respondOnException === undefined) {
				// server will respond with 500 on exception
				response.setupExceptionHandler(req, res, responseObj);
			}

			// check for request hook
			var requestHookExecuted = handleRequestHook(server, req, res, requestObj, responseObj, methodExec, parsedUrl, startTime);
			if (requestHookExecuted) {
				return;
			}

			log.verbose(parsedUrl.controller + '/' + parsedUrl.method + ' [' + requestObj.getMethod() + '] executed');
	
			// invoke the controller method
			methodExec(requestObj, responseObj);

			return;
		}	
		
		return errorHandler(server, req, res, parsedUrl, requestObj, new Error('controller not found:' + path), 404, startTime);
			

	} catch (exception) {
		
		if (exception.message === 'Cannot find module \'' + path + '\'') {
			return errorHandler(server, req, res, parsedUrl, requestObj, exception, 404, startTime);
		}

		log.fatal('exception caught:', exception);

		errorHandler(server, req, res, parsedUrl, requestObj, exception, 500, startTime);		

	}

}

function handleRequestHook(server, req, res, requestObj, responseObj, methodExec, parsedUrl, startTime) {
	if (requestHooks) {

		var hook;

		if (typeof requestHooks === 'function') {
			// request hook applies to all controllers and methods
			hook = requestHooks;
		}
		var hookedController = requestHooks[parsedUrl.controller] || null;
		if (hookedController) {
			if (typeof hookedController === 'function') {
				// request hook applies to this controller and all of its methods
				hook = hookedController;
			}
			var hookedMethod = hookedController[parsedUrl.method] || null;
			if (typeof hookedMethod === 'function') {
				// request hook applies to this controller and this method only
				hook = hookedMethod;
			}
		}

		if (hook) {		
			// hook function found
			execRequestHook(server, req, res, requestObj, responseObj, hook, methodExec, parsedUrl, startTime);
			return true;
		}
	}
	return false;
}

function execRequestHook(server, req, res, requestObj, responseObj, hook, methodExec, parsedUrl, startTime) {
	var url = parsedUrl.controller + '/' + parsedUrl.method;
	log.verbose('request hook found for "' + url + '"');
	hook(requestObj, function (error, status) {
		if (error) {
			log.error('request hook executed with an error (url:' + url + '):', error, '(status: ' + status + ')');
			return errorHandler(server, req, res, parsedUrl, requestObj, error, status, startTime);
		}
		log.verbose('request hook executed');
		methodExec(requestObj, responseObj);
	});

}

function errorHandler(server, req, res, parsedUrl, requestObj, msg, status, startTime) {
	// default status is 404
	status = status || 404;

	log.error('(url:' + req.url + ')', msg);
	
	// check to see if we have error controller and method assigned
	if (config.error && !parsedUrl.error) {
		var errorController = config.error[status] || null;
		if (errorController) {
			parsedUrl.error = true; // this flag is set to prevent possible infinite loop of error on error handler
			parsedUrl.originalRequest = {
				controller: parsedUrl.controller,
				method: parsedUrl.method
			};
			parsedUrl.controller = errorController.controller;
			parsedUrl.method = errorController.method;
			// we have the error controller assigned for this error
			log.verbose('error handler(' + status + ') configured:', errorController);
			// check to see if we already have requestObj or not
			if (requestObj) {
				// we alreay have request object
				return handle(server, req, res, parsedUrl, requestObj, startTime);
			}
			// we do not have request object yet
			return module.exports.exec(server, req, res, parsedUrl, startTime);
		}
	}

	if (msg instanceof Error) {
		msg = msg.message;
	}

	if (typeof msg === 'object') {
		msg = JSON.stringify(msg);
	}

	if (parsedUrl.error) {
		log.error('error handler configured, but failed to execute:', '(error:' + msg + ')', parsedUrl);
	}

	// no error controller assigned for this error
	var responder = new response.create(server, req, res, startTime);
	responder._error(msg, status);
}

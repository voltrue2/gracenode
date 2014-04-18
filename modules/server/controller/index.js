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

module.exports.exec = function (req, res, parsedUrl) {
	var request = new Request(req, res, parsedUrl.args);
	request.setup(function (error) {
		if (error) {
			return errorHandler(req, res, error);
		}
		handle(req, res, parsedUrl, request);
	});
}; 

module.exports.execError = errorHandler;

function handle(req, res, parsedUrl, requestObj) {
	var path = gracenode.getRootPath() + config.controllerPath + parsedUrl.controller;

	try {
		if (controllerMap[parsedUrl.controller]) {
	
			// load controller
			var controller = require(path);
			log.verbose('controller "' + parsedUrl.controller + '" loaded');
	
			log.debug(controller.allowedRequestMethods);
	
			// check to see if request method restriction has been applied or not for this method
			if (controller.allowedRequestMethods && controller.allowedRequestMethods[parsedUrl.method]) {
				// this method has request method restriction
				if (controller.allowedRequestMethods[parsedUrl.method] !== requestObj.getMethod()) {
					var msg = requestObj.url + ' accepts "' + controller.allowedRequestMethods[parsedUrl.method] + '" only "' + requestObj.getMethod() + '" given';
					return errorHandler(req, res, msg, 400);
				}
			}

			// create arguments for the controller method
			parsedUrl.args = [requestObj];
			
			// validate controller method
			if (!controller[parsedUrl.method]) {
				return errorHandler(req, res, 'invalid method ' + parsedUrl.controller + '.' + parsedUrl.method);
			}

			// create final response callback and append it to the arguments
			parsedUrl.args.push(response.create(req, res));

			// check for request hook
			var requestHookExecuted = handleRequestHook(req, res, controller, parsedUrl);
			if (requestHookExecuted) {
				return;
			}

			// invoke the controller method
			log.verbose(parsedUrl.controller + '.' + parsedUrl.method + ' executed');
			controller[parsedUrl.method].apply(controller, parsedUrl.args);			

			return;
		}	
		
		return errorHandler(req, res, 'controller not found:' + path);
			

	} catch (exception) {

		log.fatal('exception caught:', exception);

		errorHandler(req, res, exception, 500);		

	}

}

function handleRequestHook(req, res, controller, parsedUrl) {
	if (requestHooks) {
		if (typeof requestHooks === 'function') {
			// request hook applies to all controllers and methods
			execRequestHook(req, res, requestHooks, controller, parsedUrl);
			return true;
		} 
		var hookedController = requestHooks[parsedUrl.controller] || null;
		if (hookedController) {
			if (typeof hookedController === 'function') {
				// request hook applies to this controller and all of its methods
				execRequestHook(req, res, hookedController, controller, parsedUrl);
				return true;
			}
			var hookedMethod = hookedController[parsedUrl.method] || null;
			if (typeof hookedMethod === 'function') {
				// request hook applies to this controller and this method only
				execRequestHook(req, res, hookedMethod, controller, parsedUrl);
				return true;
			}
		}		
	}
	return false;
}

function execRequestHook(req, res, hook, controller, parsedUrl) {
	var url = parsedUrl.controller + '/' + parsedUrl.method;
	log.verbose('request hook found for "' + url + '"');
	hook(parsedUrl.args[0], function (error, status) {
		if (error) {
			log.error('request hook executed with an error (url:' + url + '):', error, '(status: ' + status + ')');
			return errorHandler(req, res, error, status);
		}
		log.verbose('request hook executed');
		controller[parsedUrl.method].apply(controller, parsedUrl.args);			
	});

}

function errorHandler(req, res, errorMsg, status) {

	status = status || 404;	

	log.error('errorHandler (url:' + req.url + '):', errorMsg);
	
	if (handleError(req, res, status)) {
		// stop here and let handleError deal with it
		return;
	}
	
	// we can not have handleError deal with it
	var responder = new response.create(req, res);
	if (errorMsg instanceof Error) {
		errorMsg = errorMsg.message;
	}
	responder.error(JSON.stringify(errorMsg), status);
}

function handleError(req, res, status) {
	if (config.error) {
		var errorHandler = config.error[status.toString()] || null;
		if (errorHandler) {
			errorHandler.args = [];
			log.verbose('error handler(' + status + ') configured:', errorHandler);
			if (controllerMap[errorHandler.controller]) {
				handle(req, res, errorHandler, {});
				return true;
			}
			log.verbose('error handler for ' + status + ' not found');
			var responder = new response.create(req, res);
			responder.error(null, status);
			return true;
		}
	}
	// no error handling given in config
	return false;	
}

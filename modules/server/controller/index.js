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
	var request = new Request(req, res, parsedUrl.parameters);
	request.setup(function (error) {
		if (error) {
			return errorHandler(req, res, error);
		}
		handle(req, res, parsedUrl, request);
	});
}; 

module.exports.execError = errorHandler;

function handle(req, res, parsedUrl, requestObj) {
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
				return errorHandler(req, res, msg, 400);
			}

			// controller method
			var methodExec = method[requestObj.getMethod()];

			// create file response object
			var responseObj = response.create(req, res);

			// check for request hook
			var requestHookExecuted = handleRequestHook({ req: req, res: res }, requestObj, responseObj, methodExec, parsedUrl);
			if (requestHookExecuted) {
				return;
			}

			log.verbose(parsedUrl.controller + '.' + parsedUrl.method + ' [' + requestObj.getMethod() + '] executed');
	
			// invoke the controller method
			methodExec(requestObj, responseObj);

			return;
		}	
		
		return errorHandler(req, res, 'controller not found:' + path);
			

	} catch (exception) {

		if (exception.message === 'Cannot find module \'' + path + '\'') {
			return errorHandler(req, res, exception, 404);
		}

		log.fatal('exception caught:', exception);

		errorHandler(req, res, exception, 500);		

	}

}

function handleRequestHook(origin, req, res, methodExec, parsedUrl) {
	if (requestHooks) {
		if (typeof requestHooks === 'function') {
			// request hook applies to all controllers and methods
			execRequestHook(origin, req, res, requestHooks, methodExec, parsedUrl);
			return true;
		} 
		var hookedController = requestHooks[parsedUrl.controller] || null;
		if (hookedController) {
			if (typeof hookedController === 'function') {
				// request hook applies to this controller and all of its methods
				execRequestHook(origin, req, res, hookedController, methodExec, parsedUrl);
				return true;
			}
			var hookedMethod = hookedController[parsedUrl.method] || null;
			if (typeof hookedMethod === 'function') {
				// request hook applies to this controller and this method only
				execRequestHook(origin, req, res, hookedMethod, methodExec, parsedUrl);
				return true;
			}
		}		
	}
	return false;
}

function execRequestHook(origin, req, res, hook, methodExec, parsedUrl) {
	var url = parsedUrl.controller + '/' + parsedUrl.method;
	log.verbose('request hook found for "' + url + '"');
	hook(req, function (error, status) {
		if (error) {
			log.error('request hook executed with an error (url:' + url + '):', error, '(status: ' + status + ')');
			return errorHandler(origin.req, origin.res, error, status);
		}
		log.verbose('request hook executed');
		methodExec(req, res);
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
			errorHandler.parameters = [];
			log.verbose('error handler(' + status + ') configured:', errorHandler);
			if (controllerMap[errorHandler.controller]) {
				module.exports.exec(req, res, errorHandler);
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

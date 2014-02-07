
var gracenode = require('../../../');
var log = gracenode.log.create('server-controller');

var queryDataHandler = require('../queryData');
var headers = require('../requestHeaders');
var response = require('../response');

var Cookies = require('cookies');
var queryString = require('querystring');
var url = require('url');
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
	extractQueries(req, function (error, queryData) {
		handle(req, res, parsedUrl, queryData);
	});
}; 

module.exports.execError = errorHandler;

function extractQueries(req, cb) {
	switch (req.method) {
		case 'POST':
			var body = '';
			req.on('data', function (data) {
				body += data;
			});
			req.on('end', function () {
				var post = queryString.parse(body);
				cb(null, { post: post, get: null });
			});
			req.on('error', function (error) {
				cb(error);
			});
			break;
		case 'GET':
			var parsed = url.parse(req.url, true);
			cb(null, { post: null, get: parsed.query });
			break;
		default:
			log.warning('only POST and GET are supported');
			cb(null, { post: null, get: null });
			break;
	}
}

function handle(req, res, parsedUrl, queryData) {
	
	var path = gracenode.getRootPath() + config.controllerPath + parsedUrl.controller;

	try {
		if (controllerMap[parsedUrl.controller]) {
			
			// load controller
			var controller = require(path);
			log.verbose('controller "' + parsedUrl.controller + '" loaded');

			// create arguments for the controller method
			var reqArray = [new RequestObj(req, res, queryData)];
			parsedUrl.args = reqArray.concat(parsedUrl.args);
			
			// validate controller method
			if (!controller[parsedUrl.method]) {
				return errorHandler(req, res, 'invalid method ' + parsedUrl.controller + '.' + parsedUrl.method);
			}

			// create final response callback and append it to the arguments
			parsedUrl.args.push(response.create(req, res));

			// validate controller method requirement(s)
			var args = gracenode.lib.getArguments(controller[parsedUrl.method]);
			if (parsedUrl.args.length !== args.length) {
				return errorHandler(req, res, 'number of arguments does not match');
			}

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
			// request hook applies to all controller and method
			execRequestHook(req, res, requestHooks, controller, parsedUrl);
			return true;
		} 
		var hookedController = requestHooks[parsedUrl.controller] || null;
		if (hookedController) {
			if (typeof hookedController === 'function') {
				// request hook applies to this controller and all of its method
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
	log.verbose('request hook found for "' + parsedUrl.controller + '.' + parsedUrl.method + '"');
	hook(parsedUrl.args[0], function (error, status) {
		if (error) {
			log.error('request hook executed with an error:', error, '(status: ' + status + ')');
			return errorHandler(req, res, error, status);
		}
		log.verbose('request hook executed');
		controller[parsedUrl.method].apply(controller, parsedUrl.args);			
	});

}

function errorHandler(req, res, errorMsg, status) {

	status = status || 404;	

	log.error('errorHandler:', errorMsg);
	
	if (handleError(req, res, status)) {
		// stop here and let handleError deal with it
		return;
	}
	
	// we can not have handleError deal with it
	var responder = new response.create(req, res);
	if (errorMsg instanceof Error) {
		errorMsg = errorMsg.message;
	}
	responder.error(JSON.stringify({ error: errorMsg }), status);
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

function RequestObj(request, response, reqData) {
	this._props = {};
	this._response = response;
	
	// public
	this.cookies = new Cookies(request, response);
	this.postData = queryDataHandler.createGetter(reqData.post || {});
	this.getData = queryDataHandler.createGetter(reqData.get || {});
	this.requestHeaders = headers.create(request.headers);
}

RequestObj.prototype.set = function (name, value) {
	this._props[name] = value;
};

RequestObj.prototype.get = function (name) {
	if (this._props[name] === undefined) {
		return null;
	}
	return gracenode.lib.cloneObj(this._props[name]);
};

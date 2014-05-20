var gracenode = require('../../');
var log = gracenode.log.create('server-controller');
var Request = require('./request');
var response = require('./response');
var serverError = require('./error');
var hook = require('./hook');

var config = null;

module.exports.readConfig = function (configIn) {
	if (!configIn || !configIn.controllerPath) {
		throw new Error('invalid configurations:\n', JSON.stringify(configIn, null, 4));
	}
	config = configIn;
};

module.exports.exec = function (resource) {
	
	// check for not found error
	if (resource.parsedUrl.notFound) {
		return errorHandler(resource);
	}

	var request = new Request(resource.rawRequest, resource.rawResponse, resource.parsedUrl.parameters);
	request.setup(function (error) {
		if (error) {
			return errorHandler(resource);
		}
		module.exports.handle(resource, request);
	});
}; 

module.exports.handle = function (resource, requestObj) {
	// path: controllerDirectory/methodFile
	var path = gracenode.getRootPath() + config.controllerPath + resource.parsedUrl.controller + '/' + resource.parsedUrl.method;

	var method = require(path);

	// controller method
	var methodExec = method[requestObj.getMethod()] || null;

	// validate request method
	if (!methodExec) {
		var msg = requestObj.url + ' does not accept "' + requestObj.getMethod() + '"';
		return errorHandler(resource, requestObj, msg, 400);
	}

	// create response object
	var responseObj = response.create(resource);

	// if this is pre-defined error controller, use the assigned status
	if (resource.error) {
		responseObj._setDefaultStatus(resource.error.status);
	}

	// override _errorHandler for responseObj.error()
	responseObj._errorHandler = function (error, status) {
		errorHandler(resource, requestObj, error, status);
	};

	// check for request hook
	var requestHookExecuted = hook.exec(resource, requestObj, responseObj, methodExec);
	if (requestHookExecuted) {
		return;
	}

	log.verbose(resource.parsedUrl.controller + '/' + resource.parsedUrl.method + ' [' + requestObj.getMethod() + '] executed');

	// invoke the controller method
	methodExec(requestObj, responseObj);
};

function errorHandler(resource, requestObj, msg, status) {
	var sError = serverError.create(resource);
	if (requestObj) {
		sError.setRequest(requestObj);
	}
	sError.handle(msg, status);
}

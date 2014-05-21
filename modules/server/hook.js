var gracenode = require('../../');
var logger = gracenode.log.create('server-hook');
var serverError = require('./error');
var hooks = null;

module.exports.setupRequestHooks = function (hooksIn) {
	hooks = hooksIn;
};

module.exports.exec = function (resource, requestObj, responseObj, methodFunc) {
	if (hooks) {
		var hook;
		if (typeof hooks === 'function') {
			// request hook applies to all controllers and methods
			hook = hooks;
		}
		var hookedController = hooks[resource.parsedUrl.controller] || null;
		if (hookedController) {
			if (typeof hookedController === 'function') {
				// request hook applies to this controller and all of its methods
				hook = hookedController;
			}
		}
		var hookedMethod = hooks[resource.parsedUrl.method] || null;
		if (hookedMethod) {
			if (typeof hookedMethod === 'function') {
				// request hook applies to this controller and this method only
				hook = hookedMethod;
			}
		}

		// do we have a hook?
		if (hook) {
			execHook(hook, resource, requestObj, responseObj, methodFunc);
			return true;
		}
	}
	// there is no hook for this request
	return false;
};

function execHook(hook, resource, requestObj, responseObj, methodFunc) {
	var url = resource.rawRequest.url;
	logger.verbose('request hook found for (url:' + url + ')');
	hook(requestObj, function (error, status) {
		if (error) {
			logger.error('request hook executed with an error (url:' + url + '):', '(status: ' + status + ')');
			var sError = serverError.create(resource);
			sError.setRequest(requestObj);
			sError.setResponse(responseObj);
			return sError.handle(error, status);
		}
		logger.verbose('request hook successfully executed (url:' + url + ')');
		methodFunc(requestObj, responseObj);
	});
}

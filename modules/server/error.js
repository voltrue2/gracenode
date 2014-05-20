var gracenode = require('../../');
var logger = gracenode.log.create('server-error');
var response = require('./response');
var controller = require('./controller');

var config;

var DEFAULT_STATUS = 404;

module.exports.readConfig = function (configIn) {
	config = configIn;
};

module.exports.create = function (resource) {
	return new ServerError(resource);
};

function ServerError(resource) {
	// server module itself
	this._resource = resource;
	// this is NOT raw request. this can be set later from controller
	this._request = null;
	// this is NOT raw response. this can be set later from hook
	this._response = null;
}

ServerError.prototype.setRequest = function (request) {
	this._request = request;
};

ServerError.prototype.setResponse = function (response) {
	this._response = response;
};

ServerError.prototype.handle = function (msg, status) {
	status = status || DEFAULT_STATUS;
	logger.error('(url:' + this._resource.rawRequest.url + ')', msg);
	// check if there is pre-defined error assigned for this status
	if (config.error && config.error[status] && !this._resource.error) {
		var error = config.error[status];
		logger.verbose('error handler for (status:' + status + ') pre-defined:', error);
		// we set error flag to prevent possible infinite loop of error on error controller
		this._resource.setError(error, status);
		// execute error controller
		if (this._request) {
			// we already have a request object
			return controller.handle(this._resource, this._request);
		}
		// make sure parsedUrl.notFound is not present, so we don't come back here without executing re-defined error controller
		delete this._resource.parsedUrl.notFound;
		// we do not have reuqest object, execute controller and create it
		return controller.exec(this._resource);
	}
	if (this._resource.error) {
		logger.error('pre-defined error controller failed to execute:', '(url:' + this._resource.rawRequest.url + ')', this._resource.error);
	}
	// no pre-defined error assigned for this status
	if (msg instanceof Error) {
		msg = msg.message;
	}
	if (typeof msg === 'object') {
		msg = JSON.stringify(msg);
	}
	if (!this._response) {
		// create response object of server module
		this._response = response.create(this._resource);
	}
	// respond to the client as an error
	this._response._error(msg, status);
};

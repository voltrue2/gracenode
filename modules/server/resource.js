// object to keep server module object, raw request, response, parsedUrl, startTime of a request

module.exports.create = function (server, req, res, parsedUrl, startTime) {
	return new Resource(server, req, res, parsedUrl, startTime);
};

function Resource(server, req, res, parsedUrl, startTime) {
	this.server = server;
	this.rawRequest = req;
	this.rawResponse = res;
	this.parsedUrl = parsedUrl;
	this.startTime = startTime;
	this.error = null;
}

// if this has been set, server error will not execute pre-defined error controller
// this is to prevent possible infinite loop on error from error controller
Resource.prototype.setError = function (error, status) {
	this.error = error;
	this.error.status = status;
	// we swap parsedUrl.controller and parsedUrl.method with error controller and method
	this.parsedUrl.controller = error.controller;
	this.parsedUrl.method = error.method;
};

var gracenode = require('../../');
var log = gracenode.log.create('server-response');
var zlib = require('zlib');
var getMimeType = require('./mime');

module.exports.create = function (resource) {
	return new Response(resource.server, resource.rawRequest, resource.rawResponse, resource.startTime);
};

function Response(server, request, response, startTime) {
	this._server = server;
	this._request = request;
	this._response = response;
	this._startTime = startTime;
	this._defaultStatus = 200;
}

Response.prototype.header = function (name, value) {
	this._response.setHeader(name, value);
};

Response.prototype.json = function (content, status) {
	log.verbose('response content type: JSON');
	setupFinish(this._request, this._response, this._server, this._startTime);
	respondJSON(this._request, this._response, content, status || this._defaultStatus);
	finish(this._request, this._response, this._server);
};

Response.prototype.html = function (content, status) {
	log.verbose('response content type: HTML');
	setupFinish(this._request, this._response, this._server, this._startTime);
	respondHTML(this._request, this._response, content, status || this._defaultStatus);
	finish(this._request, this._response, this._server);
};

Response.prototype.data = function (content, status) {
	log.verbose('response content type: Data');
	setupFinish(this._request, this._response, this._server, this._startTime);
	respondData(this._request, this._response, content, status || this._defaultStatus);
	finish(this._request, this._response, this._server);
};

Response.prototype.file = function (content, status) {
	log.verbose('response content type: File');
	setupFinish(this._request, this._response, this._server, this._startTime);
	respondFILE(this._request, this._response, content, status || this._defaultStatus);
	finish(this._request, this._response, this._server);
};

Response.prototype.error = function (content, status) {
	this._errorHandler(content, status);
};

Response.prototype.download = function (content, fileName, status) {
	var fileType = fileName.substring(fileName.lastIndexOf('.') + 1);
	log.verbose('response content type:', fileType);
	this.header('Content-Disposition', 'attachment; filename=' + fileName);
	setupFinish(this._request, this._response, this._server, this._startTime);
	respondDownload(this._request, this._response, content, fileType, status || this._defaultStatus);
	finish(this._request, this._response, this._server);
};

Response.prototype.redirect = function (content) {
	log.verbose('response content type: Redirect');
	setupFinish(this._request, this._response, this._server, this._startTime);
	respondRedirect(this._request, this._response, content);
	finish(this._request, this._response, this._server);
};

// internal use only
Response.prototype._setDefaultStatus = function (status) {
	this._defaultStatus = status;
};

// overrriden by controller
Response.prototype._errorHandler = function () {

};

Response.prototype._error = function (content, status) {
	log.verbose('response content type: Error');
	setupFinish(this._request, this._response, this._server, this._startTime);
	respondERROR(this._request, this._response, content, status);
	finish(this._request, this._response, this._server);
};

// sets up events for response finish. The events will be called when the request response has all been sent.
function setupFinish(req, res, server, startTime) {
	// this will be called when the server sends the response data and finishes it.
	res.once('finish', function () {
		var execTime = Date.now() - startTime;
		var msg = 'request responded: (url:' + req.url + ') (took:' + execTime + 'ms) (status:' + res.statusCode + ')';
		if (res.statusCode > 399) {
			log.error(msg);	
		} else {
			log.info(msg);
		}
		server.emit('requestFinish', req.url, execTime);
	});
}

function finish(req, res, server) {
	res.emit('end', req.url);
	// this will be called when the server finishes all operation (not when the response data sent)
	server.emit('requestEnd', req.url);
}

function compressContent(req, content, cb) {
	if (content instanceof Buffer) {
		// we do not compress binary
		log.verbose('skip compressing binary data: (url:' + req.url + ') ' + (content.length / 1024) + 'KB');
		cb(null, content);
	}
	zlib.gzip(content, function (error, compressedData) {
		if (error) {
			return cb(error);
		}
		log.verbose('compressed content size: (url:' + req.url + ') ' + (compressedData.length / 1024) + ' KB');

		cb(null, compressedData);
	});
}

function respondJSON(req, res, content, status) {
	content = content || null;
	compressContent(req, JSON.stringify(content), function (error, data) {
		
		if (error) {
			log.error('compression error: (url:' + req.url, + ')', error);
			status = 500;
			data = error;
		}

		res.writeHead(status, {
			'Cache-Control': 'no-cache, must-revalidate',
			'Connection': 'Keep-Alive',
			'Content-Encoding': 'gzip',
			'Content-Type': 'application/json; charset=UTF-8',
			'Pragma': 'no-cache',
			'Vary': 'Accept-Encoding',
			'Content-Length': data.length
		});

		res.end(data, 'binary');		

	});

}

function respondHTML(req, res, content, status) {
	content = content || null;
	compressContent(req, content, function (error, data) {
		
		if (error) {
			log.error('compression error: (url:' + req.url, + ')', error);
			status = 500;
			data = error;
		}

		res.writeHead(status, {
			'Cache-Control': 'no-cache, must-revalidate',
			'Connection': 'Keep-Alive',
			'Content-Encoding': 'gzip',
			'Content-Type': 'text/html; charset=UTF-8',
			'Pragma': 'no-cache',
			'Vary': 'Accept-Encoding',
			'Content-Length': data.length
		});

		res.end(data, 'binary');		

	});
}

function respondData(req, res, content, status) {
	content = content || null;
	compressContent(req, content, function (error, data) {
		
		if (error) {
			log.error('compression error: (url:' + req.url + ')', error);
			status = 500;
			data = error;
		}

		res.writeHead(status, {
			'Cache-Control': 'no-cache, must-revalidate',
			'Connection': 'Keep-Alive',
			'Content-Encoding': 'gzip',
			'Content-Type': 'text/plain; charset=UTF-8',
			'Pragma': 'no-cache',
			'Vary': 'Accept-Encoding',
			'Content-Length': data.length
		});

		res.end(data, 'binary');		

	});
}

function respondDownload(req, res, content, type, status) {
	content = content || null;
	compressContent(req, content, function (error, data) {
		
		if (error) {
			log.error('compression error: (url:' + req.url + ')', error);
			status = 500;
			data = error;
		}

		res.writeHead(status, {
			'Cache-Control': 'no-cache, must-revalidate',
			'Connection': 'Keep-Alive',
			'Content-Encoding': 'gzip',
			'Content-Type': getMimeType(type) + '; charset=UTF-8',
			'Pragma': 'no-cache',
			'Vary': 'Accept-Encoding',
			'Content-Length': data.length
		});

		res.end(data, 'binary');		

	});
}

function respondRedirect(req, res, content) {
	content = content || null;
	var status = 301;
	// content needs to be redirect URL
	res.writeHead(status, {
		Location: content
	});
	
	log.verbose('redirect to: ', content);

	res.end();
}

function respondFILE(req, res, content, status) {
	content = content || null;
	var type = req.url.substring(req.url.lastIndexOf('.') + 1);
	var contentSize = content.length;
	res.writeHead(status, {
		'Content-Length': contentSize,
		'Content-Type': getMimeType(type)
	});
	
	log.verbose('response content size: (url:' + req.url + ') ' + (contentSize / 1024) + ' KB');

	res.end(content, 'binary');

}

function respondERROR(req, res, content, status) {
	content = content || null;
	if (content !== null && typeof content === 'object') {
		content = JSON.stringify(content);
	}
	status = status || 400;
	compressContent(req, content, function (error, data) {
		
		if (error) {
			log.error('(url:' + req.url + ')', error);
			status = 500;
			data = error;
		}

		var contentSize = data.length;
		res.writeHead(status, {
			'Cache-Control': 'no-cache, must-revalidate',
			'Connection': 'Keep-Alive',
			'Content-Encoding': 'gzip',
			'Content-Type': 'text/plain; charset=UTF-8',
			'Pragma': 'no-cache',
			'Vary': 'Accept-Encoding',
			'Content-Length': data.length
		});
		
		log.verbose('response content size: (url:' + req.url + ') ' + (contentSize / 1024) + ' KB');
	
		res.end(data, 'binary');

	});
}

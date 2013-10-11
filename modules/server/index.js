
/**
 * configurations
 * {
 *		"server": {
 *			"port": port number,
 *			"host": "host name or ip address",
 *			"controllerPath": "path to controller directory"
 *			"ignored": ["name of a request you want to ignore", "favicon.ico"]
 *		}
 * }
 * */
var fs = require('fs');
var sq = require('querystring');
var url = require('url');
var zlib = require('zlib');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var http = require('http');

var gracenode = require('../../gracenode');
var log = gracenode.log.create('server');
var queryData = require('./queryData.js');
var headers = require('./requestHeaders.js');

var config = null;
var contentTypes = {
	JSON: 'JSON',
	HTML: 'HTML'
};

exports.readConfig = function (configIn) {
	if (!configIn || !configIn.port || !configIn.host || !configIn.controllerPath) {
		return new Error('invalid configurations: \n' + JSON.stringify(configIn, null, 4));
	}
	config = configIn;
};

exports.start = function () {
	
	log.verbose('starting server...');
	
	var server = http.createServer(function (request, response) {
		
		gracenode.profiler.start();
		gracenode.profiler.mark('handling request [' + request.url + ']');
	
		var reqHeader = request.headers;
		var controllerData = parseUri(request.url);
	
		// check for ignored
		var ignored = config.ignored || [];
		if (ignored.indexOf(controllerData.controller) !== -1) {
			// ignored request detected
			log.verbose('ignored request: ', request.url);
			return respond(request, response, 200, '', 'JSON');
		}
	
		log.verbose('request recieved: ', request.url, controllerData);
	
		// extract post/get
		extractQuery(request, function (data) {
			execController(controllerData, data, request, response);
		});
	});
	server.listen(config.port, config.host);

	log.verbose('server started: ', config.host + ':' + config.port);

	// listener for GraceNode shutdown
	gracenode.event.on('shutdown', function () {
		log.verbose('stopping server...');
	});
};

/**
 * used to respond to the client with 404 error from controller
 * */
exports.userError = function (error, res, cb) {
	cb(error, res, 404);
};

/**
 * used to respond to the client with 500 error from controller
 * */
exports.error = function (error, res, cb) {
	cb(error, res, 500);
};

/**
 * parse URL and get controller name and method
 * example: http://yourdomain.com/<controller name>/<method>/[parameters]
 * */
function parseUri(uri) {
	var queryIndex = uri.lastIndexOf('?');
	if (queryIndex !== -1) {
		uri = uri.substring(0, uri.lastIndexOf('?'));
	}
	var splitted = uri.split('/');
	var parsed = splitted.filter(function (item) {
		if (item !== '') {
			return item;
		}
	});
	return {
		controller: parsed[0] || null,
		method: parsed[1] || null,
		args: parsed.length > 2 ? parsed.splice(2) : []
	};
}

function extractQuery(request, cb) {
	if (request.method === 'POST') {
		var body = '';
		request.on('data', function (data) {
			body += data;
		});
		request.on('end', function () {
			var post = sq.parse(body);
			cb({ post: post, get: null });
		});
	} else {
		var parsed = url.parse(request.url, true);
		cb({ post: null, get: parsed.query });
	}
}

function execController(data, reqData, request, response) {
	try {
		// verify the controller file
		var path = config.controllerPath + data.controller;
		fs.readdir(path, function (error, dirData) {
			if (error) {
				log.error('controller not found: ', path);
				return respond(request, response, 404, JSON.stringify({ error: error }));
			}
			// require the found controller
			var controller = require(path);
			// pass post and get
			controller.postData = queryData.createGetter(reqData.post || {});
			controller.getData = queryData.createGetter(reqData.get || {});
			// pass request headers
			controller.requestHeaders = headers.create(request.headers);
			// final callback to the method
			var callback = function (error, res, contentType, statusCode) {
				var resCode = statusCode || 200;
				var resData = res;
				if (error) {
					if (!statusCode) {
						resCode = 404;
					}
					log.error(error);
				}

				gracenode.profiler.mark(data.controller + '.' + data.method);
		 
				respond(request, response, resCode, resData, contentType);
			};
			// validate method
			if (!controller[data.method]) {
				var errorMsg = 'invalid method ' + data.controller + '.' + data.method + '()';

				log.error(new Error(errorMsg));

				return respond(request, response, 404, JSON.stringify({ error: errorMsg }));
			}
			// call method 
			data.args.push(callback);
			controller[data.method].apply(controller, data.args);
		}); 
	} catch (exception) {
		
		log.error(exception);
		
		var errData = JSON.stringify({ error: exception });
		respond(request, response, 500, errData);
	}
}

function respond(request, response, resCode, data, contentType) {
	log.verbose('resonding content type: ', contentType);
	switch (contentType) {
		case contentTypes.JSON:
			respondJSON(request, response, resCode, data);
			break;
		case contentTypes.HTML:
			respondHTML(request, response, resCode, data);
			break;
		default: 
			throw new Error('invalid content type given: ' + contentType);
			break;
	}
}

function respondJSON(request, response, resCode, data) {
	data = JSON.stringify(data);
	zlib.gzip(data, function (error, compressedData) {
		if (error) {
			log.error(error);
			
			resCode = 500;
			compressedData = JSON.stringify({ error: error });
		}
		response.writeHead(resCode, {
			'Cache-Control': 'no-cache, must-revalidate',
			'Connection': 'Keep-Alive',
			'Content-Encoding': 'gzip',
			'Content-Length': compressedData.length,
			'Content-Type': 'text/plain;charset=UTF-8',
			'Pragma': 'no-cache',
			'Vary': 'Accept-Encoding'
		});
		response.end(compressedData);
		
		if (resCode >= 200 && resCode <= 399) {
			log.verbose('responded to request: ', request.url, resCode);
		} else if (rescode >= 400 && rescode <= 499) {
			log.error('responded to request: ', request.url, resCode);
		} else if (resCode >= 500) {
			log.fatal('responded to request: ', request.url, resCode);
		}
		gracenode.profiler.stop();
	});
}

function respondHTML(request, response, resCode, data) {
	zlib.gzip(data, function (error, compressedData) {
		if (error) {
			log.error(error);
			
			resCode = 500;
			compressedData = JSON.stringify({ error: error });
		}
		response.writeHead(resCode, {
			'Cache-Control': 'no-cache, must-revalidate',
			'Connection': 'Keep-Alive',
			'Content-Encoding': 'gzip',
			'Content-Length': compressedData.length,
			'Content-Type': 'text/html; charset=utf-8',
			'Pragma': 'no-cache',
			'Vary': 'Accept-Encoding'
		});

		response.end(compressedData, 'binary');
		
		if (resCode >= 200 && resCode <= 399) {
			log.verbose('responded to request: ', request.url, resCode);
		} else if (rescode >= 400 && rescode <= 499) {
			log.error('responded to request: ', request.url, resCode);
		} else if (resCode >= 500) {
			log.fatal('responded to request: ', request.url, resCode);
		}
		gracenode.profiler.stop();
	});
}

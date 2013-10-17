
/**
 * configurations
 * {
 *		"server": {
 *			"port": port number,
 *			"host": "host name or ip address",
 *			"controllerPath": "path to controller directory"
 *			"ignored": ["name of a request you want to ignore", "favicon.ico"]
 *			"error": {
				"404": { "controller": "errorControllerName", "method": "errorMethod" },
				"500"...
			},
			"reroute": [
				{ "from": "/", "to": "/another/place/" }
			]
		}
 * }
 * */
var fs = require('fs');
var sq = require('querystring');
var url = require('url');
var zlib = require('zlib');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var http = require('http');
var https = require('https');

var gracenode = require('../../gracenode');
var log = gracenode.log.create('server');
var queryData = require('./queryData.js');
var headers = require('./requestHeaders.js');

var config = null;
var contentTypes = {
	JSON: 'JSON',
	HTML: 'HTML',
	image: 'image'
};

var controllerMap = {};

// called automatically from gracenode on start
module.exports.readConfig = function (configIn) {
	if (!configIn || !configIn.port || !configIn.host || !configIn.controllerPath) {
		return new Error('invalid configurations: \n' + JSON.stringify(configIn, null, 4));
	}
	config = configIn;
};

// called automatically from gracenode on start
module.exports.setup = function (cb) {
	// read and cache all controllers
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

module.exports.start = function () {
	
	log.info('starting server...');

	var server = null;

	// create server
	if (config.protocol === 'https') {
		// https
		var options = {
			key: fs.readFileSync(config.pemKey),
			cert: fs.readFileSync(config.pemCert)
		};
		server = https.createServer(options, requestHandler);
	} else {
		// http
		server = http.createServer(requestHandler);
	}

	log.info('server protocol:', (config.ptotocol || 'http'));

	// port/socket listener
	if (!config.socket) {
		// listen to a port
		log.verbose('listening to a port:', config.port);
		server.listen(config.port, config.host);
	} else {
		// listen to a socket file
		log.verbose('listening to a socket file:', config.socket);
		server.listen(config.socket, config.host);
	}

	log.verbose('server started: ', config.host + ':' + config.port);

	// listener for GraceNode shutdown
	gracenode.event.on('shutdown', function () {
		log.info('stopping server...');
		server.close();
		log.info('server stopped gracefully');
	});
};

/**
 * used to respond to the client with 404 error from controller
 * */
module.exports.userError = function (error, res, cb) {
	cb(error, res, 404);
};

/**
 * used to respond to the client with 500 error from controller
 * */
module.exports.error = function (error, res, cb) {
	cb(error, res, 500);
};


function requestHandler(request, response) {
	
	gracenode.profiler.start();

	var reqHeader = request.headers;
	var controllerData = parseUri(request.url);
	
	log.verbose('request recieved:', request.url);

	// check rerouting
	if (config.reroute) {
		var cont = controllerData.controller ? '/' + controllerData.controller : '/';
		var meth = controllerData.method ? controllerData.method + '/' : '';
		var from = cont + meth;
		for (var i = 0, len = config.reroute.length; i < len; i++) {
			if (config.reroute[i].from === from) {
				var reroute = config.reroute[i].to;
				controllerData = parseUri(reroute);
				request.url = reroute;
				log.verbose('rerouting: from "' + from + '" to "' + reroute + '"');
				break;
			}
		}
	}

	// check for ignored
	var ignored = config.ignored || [];
	if (ignored.indexOf(controllerData.controller) !== -1) {
		// ignored request detected
		log.verbose('ignored request: ', request.url);
		return respond(request, response, 200, '', 'JSON');
	}

	log.verbose('request resolved: ', controllerData);
	gracenode.profiler.mark('request resolved [' + request.url + ']');

	// extract post/get
	extractQuery(request, function (data) {
		execController(controllerData, data, request, response);
	});
}

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

function execController(data, reqData, request, response, forcedResCode) {
	try {
		// verify the controller file
		var path = config.controllerPath + data.controller;
		if (controllerMap[data.controller]) {
			// parse cookie
			var cookies = parseCookie(request.headers);
			// require the found controller
			var controller = require(path);
			// pass post and get
			controller.postData = queryData.createGetter(reqData.post || {});
			controller.getData = queryData.createGetter(reqData.get || {});
			// pass request headers
			controller.requestHeaders = headers.create(request.headers);
			// give setHeader() to controller
			controller.setHeader = function (name, value) {
				response.setHeader(name, value);
			};
			// give setCookie to controller
			controller.setCookie = function (obj) {
				var cookie = '';
				for (var name in obj) {
					cookie += name + '=' + obj[name] + '; ';
				}
				controller.setHeader('Set-Cookie', cookie);
			};
			// give get Cookie to controller
			controller.getCookie = function (name) {
				return cookies[name] || null;
			};
			// final callback to the method
			var callback = function (error, res, contentType, statusCode) {
				var resCode = forcedResCode ? forcedResCode : statusCode || 200;
				var resData = res;
				if (error) {
					if (!statusCode) {
						resCode = 404;
					}
					log.error(error);
					
					if (handleError(request, response, resCode)) {
						// stop
						return;
					}
				}
				// final response to client
				respond(request, response, resCode, resData, contentType);
			};
			// validate method
			if (!controller[data.method]) {
				var errorMsg = 'invalid method ' + data.controller + '.' + data.method + '()';

				log.error(new Error(errorMsg));
				
				if (handleError(request, response, 404)) {
					// stop
					return;
				}

				return respond(request, response, 404, JSON.stringify({ error: errorMsg }));
			}
			// append the last callback
			data.args.push(callback);
			// validate method requirements
			var args = gracenode.util.getArguments(controller[data.method]);
			if (data.args.length !== args.length) {
				log.error('number of arguments does not match: \ngiven', data.args, '\nexpected:', args);
				if (handleError(request, response, 404)) {
					// stop
					return;
				}
			}	
			// call method 
			controller[data.method].apply(controller, data.args);
		} else {
			log.error('controller not found: ', path);
			if (handleError(request, response, 404)) {
				// stop
				return;
			}
			return respond(request, response, 404, JSON.stringify({ error: error }));
		} 
	} catch (exception) {
		
		log.error(exception);
		
		if (handleError(request, response, 500)) {
			// stop
			return;
		}
		var errData = JSON.stringify({ error: exception });
		respond(request, response, 500, errData);
	}
}

function parseCookie(headers) {
	var cookieStr = headers['cookie'] || '';
	var chunks = cookieStr.split('; ');
	var cookies = {};
	for (var i = 0, len = chunks.length; i < len; i++) {
		var chunk = chunks[i];
		if (chunk) {
			var cookie = chunk.split('=');
			cookies[cookie[0]] = cookie[1];	
		}
	}
	return cookies;
}

function respond(request, response, resCode, data, contentType) {
	log.verbose('resonding content type: ', contentType);

	var callback = function (code) {
		if (code >= 200 && code <= 399) {
			log.verbose('responded to request: ', request.url, code);
		} else if (code >= 400 && code <= 499) {
			log.error('responded to request: ', request.url, code);
		} else if (code >= 500) {
			log.fatal('responded to request: ', request.url, code);
		}
		gracenode.profiler.mark(request.url);
		gracenode.profiler.stop();
	};

	switch (contentType) {
		case contentTypes.JSON:
			respondJSON(request, response, resCode, data, callback);
			break;
		case contentTypes.HTML:
			respondHTML(request, response, resCode, data, callback);
			break;
		case contentTypes.image:
			respondImage(request, response, resCode, data, callback);
			break;
		default: 
			log.error('invalid content type given: ' + contentType);
			respondJSON(request, response, resCode, data, callback);
			break;
	}
}

function respondJSON(request, response, resCode, data, cb) {
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
		cb(resCode);
	});
}

function respondHTML(request, response, resCode, data, cb) {
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
		cb(resCode);
	});
}

function respondImage(request, response, resCode, data, cb) {
	var type = request.url.substring(request.url.lastIndexOf('.') + 1);
	response.writeHead(resCode, {
		'Content-Length': data.length,
		'Content-Type': 'image/' + type
	});

	response.end(data, 'binary');
	cb(resCode);
}

function handleError(request, response, resCode) {
	// check for error handlers
	if (config.error) {
		var errorHandler = config.error[resCode.toString()] || null;
		if (errorHandler) {
			errorHandler.args = [];
			log.verbose('error handler(' + resCode + ') found:', errorHandler);
			execController(errorHandler, {}, request, response, resCode);
			return true;
		}
	}
	return false;
}

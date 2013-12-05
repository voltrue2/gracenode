
var gracenode = require('../../../');
var log = gracenode.log.create('server-controller');

var queryDataHandler = require('../queryData');
var headers = require('../requestHeaders');
var response = require('../response');

var queryString = require('querystring');
var url = require('url');
var fs = require('fs');

var config = null;
var controllerMap = {};
var requestHook = null;

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

module.exports.setRequestHook = function (hookFunction) {
	requestHook = hookFunction;
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
	
	// listener for the end of server response
	req.on('end', function () {
		
	});
	
	var path = gracenode.getRootPath() + config.controllerPath + parsedUrl.controller;

	try {
		if (controllerMap[parsedUrl.controller]) {
			
			// load controller
			var controller = require(path);
			log.verbose('controller "' + parsedUrl.controller + '" loaded');

			// create arguments for the controller method
			var reqArray = [createRequestObj(req, res, queryData)];
			parsedUrl.args = reqArray.concat(parsedUrl.args);
						
			// validate controller method
			if (!controller[parsedUrl.method]) {
				return errorHandler(req, res, 'invalid method ' + parsedUrl.controller + '.' + parsedUrl.method);
			}

			// create final response callback and append it to the arguments
			parsedUrl.args.push(createFinalCallback(req, res));

			// validate controller method requirement(s)
			var args = gracenode.lib.getArguments(controller[parsedUrl.method]);
			if (parsedUrl.args.length !== args.length) {
				return errorHandler('number of arguments does not match > given:\n' + JSON.stringify(parsedUrl.args) + '\nexpected:\n' +JSON.stringify(args));
			}

			// check for request hook
			if (requestHook) {

				log.verbose('request hook found');

				var requestObj = parsedUrl.args[0];
				return requestHook(requestObj, parsedUrl, function (error, status) {
					
					if (error) {
					
						log.error('request hook exeuted with an error:', error, '(status: ' + status + ')');

						return errorHandler(req, res, error, status);
					}

					log.verbose('request hook executed');
					
					controller[parsedUrl.method].apply(controller, parsedUrl.args);			

				});
			}
		
			// there is no request hook

			// invoke the controller method
			controller[parsedUrl.method].apply(controller, parsedUrl.args);			

		} else {
			
			return errorHandler(req, res, 'controller not found:' + path);
			
		}

	} catch (exception) {

		log.fatal('exception caught:', exception);

		errorHandler(req, res, exception, 500);		

	}

}

function errorHandler(req, res, errorMsg, status) {

	status = status || 404;	

	log.error('errorHandler:', errorMsg);
	
	if (handleError(req, res, status)) {
		// stop here and let handleError deal with it
		return;
	}
	
	// we can not have handleError deal with it
	response.respond(req, res, JSON.stringify({ error: errorMsg }), 'ERROR', status);
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
			response.respond(req, res, null, 'ERROR', status);
			return true;
		}
	}
	// no error handling given in config
	return false;	
}

function createFinalCallback(req, res) {
	return function (error, content, contentType, statusCode) {
		if (error) {
			
			log.error(error);
			
			if (handleError(req, res, statusCode)) {
				// stop and let handleError deal with it
				return;
			}

			return response.respond(req, res, error, 'JSON', statusCode);
		}

		// final response to the request
		response.respond(req, res, content, contentType, statusCode);
	};
}

function createRequestObj(req, res, queryData) {
	var reqObj = {};
	
	// pass post and get
	reqObj.postData = queryDataHandler.createGetter(queryData.post || {});
	reqObj.getData = queryDataHandler.createGetter(queryData.get || {});
	
	// pass request headers
	reqObj.requestHeaders = headers.create(req.headers);
	
	// give setHeader() to controller
	reqObj.setHeader = function (name, value) {
			res.setHeader(name, value);
	};
	
	// give setCookie to controller
	reqObj.setCookie = function (obj) {
			var cookie = '';
			for (var name in obj) {
					cookie += name + '=' + obj[name] + '; ';
			}
			reqObj.setHeader('Set-Cookie', cookie);
	};
	
	// parse cookie
	var cookies = parseCookie(req.headers);
	
	// give get Cookie to controller
	reqObj.getCookie = function (name) {
			return cookies[name] || null;
	};
	
	return reqObj;	
}

function parseCookie(headers) {
	var cookieStr = headers.cookie || '';
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

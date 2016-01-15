'use strict';

var uuid = require('node-uuid');
var async = require('async');
var http = require('http');
var Cookies = require('cookies');
var route = require('./route');
var request = require('./request');
var response = require('./response');
var staticRouter = require('./static');
var Response = response.Response;
var util = require('./util');
var gn = require('../gracenode');
var logger;
var config;
var server;
var trailingSlash = false;
var errorMap = {};

var ERROR = {
	NOT_FOUND: 'NOT_FOUND',
	INTERNAL: 'INTERNAL_ERROR',
	BAD_REQUEST: 'BAD_REQUEST',
	NOT_SUPPORTED: 'NOT_SUPPORTED'
};

exports.config = function (configIn) {
	logger = gn.log.create('router');
	config = configIn;
	route.setup();
	request.setup();
	response.setup();
};

exports.get = function (path, handler, opt) {
	route.define('GET', path, handler, opt);
};

exports.post = function (path, handler, opt) {
	route.define('POST', path, handler, opt);
};

exports.head = function (path, handler, opt) {
	route.define('HEAD', path, handler, opt);
};

exports.put = function (path, handler, opt) {
	route.define('PUT', path, handler, opt);
};

exports.delete = function (path, handler, opt) {
	route.define('DELETE', path, handler, opt);
};

exports.patch = function (path, handler, opt) {
	route.define('PATCH', path, handler, opt);
};

exports.static = function (path, dirList, opt) {
	if (path[path.length - 1] !== '/') {
		path += '/';
	}
	if (!Array.isArray(dirList)) {
		throw new Error('StaicDirectoryListMustBeArray: ' + dirList);
	}
	var list = staticRouter.findRoutes(dirList);
	for (var i = 0, len = list.length; i < len; i++) {
		var item = list[i];
		var filepath = path + item.route + '{string:filename}';
		exports.get(filepath, staticRouter.handle(item.path), opt);
	}
};

exports.forceTrailingSlash = function () {
	trailingSlash = true;
};

exports.hook = function (path, func) {
	route.hook(path, func);
};

exports.error = function (status, func) {
	if (errorMap[status]) {
		logger.error('Error handler already registerd for', status);
		throw new Error('ERROR_ALREADY_REGISTERD');
	}
	logger.info('Error handler registered for:', status, '[' + (func.name || 'anonymous') + ']');
	errorMap[status] = func;
};

exports.setup = function (cb) {
	//route.setup();
	server = http.createServer(requestHandler);
	server.on('listening', function () {
		logger.info(
			'HTTP server router started:',
			config.host + ':' + config.port
		);
		cb();
	});
	server.on('error', function (error) {
		logger.fatal(
			'HTTP server router failed to start:',
			(config.host + ':' + config.port)
		);
		cb(error);
	});
	gn.onExit(function (next) {
		try {
			logger.info('Stopping HTTP server...');
			server.close();
			logger.info(
				'HTTP server stopped gracefully:',
				config.host + ':' + config.port
			);
			next();
		} catch (e) {
			if (e.message === 'Not running') {
				logger.verbose(e.message);
				return next();
			}
			logger.error('HTTP server error on stop:', e);
			next(e);
		}
	});
	try {
		server.listen(config.port, config.host);
	} catch (error) {
		logger.fatal(
			'HTTP server router failed to start:',
			config.host, ':', config.port
		);
		cb(error);
	}
};

function requestHandler(req, res) {
	
	if (trailingSlash) {
		var uriComponents = req.url.split('?');
		var uri = uriComponents[0];
		var queries = uriComponents[1] ? '?' + uriComponents[1] : '';
		var trailing = uri.substring(uri.length - 1);
		if (trailing !== '/') {
			logger.verbose(
				'Enforcing trailing slash on',
				util.fmt('url', req.method + ' ' + req.url)
			);
			res.writeHeader(307, { location: uri + '/' + queries });
			return res.end();
		}
	}

	// shared data for hooks and request handler
	req.args = {};
	// assign request ID
	req.id = uuid.v4();
	// set start time
	req.startTime = Date.now();

	var parsed;
	var method = req.method;
	var resp = new Response(req, res, errorMap);
	try {
		parsed = route.find(method, req.url);
	} catch (error) {
		// request error
		resp.error(error, 400);
		return;
	}
	logger.info(
		'Request Resolved:',
		util.fmt('url', req.method + ' ' + req.url),
		util.fmt('id', req.id),
		'\n<resolved>', parsed
	);

	if (parsed === null) {
		// 404
		resp.error(new Error(ERROR.NOT_FOUND), 404);
		return;	
	}

	// listener on unexpected connection termination
	res.on('close', function () {
		logger.error(
			'Connection closed unexpectedly:',
			util.fmt('url', req.method + ' ' + req.url),
			util.fmt('id', req.id),
			util.fmt('time', Date.now() - req.startTime),
			'\n<headers>',
			req.headers
		);		
	});

	var handleHook = function (hook, next) {
		logger.verbose(
			'Execute request hook for',
			util.fmt('url', req.method + ' ' + req.url),
			util.fmt('id', req.id),
			util.fmt('hook name', (hook.name || 'anonymous'))
		);
		hook(req, resp, next);
	};

	// parsed url path
	req.path = parsed.path;
	// request GET parameters
	req.query = parsed.query;
	// request URL parameters
	req.params = parsed.params;
	// extract request body
	request.getReqBody(parsed.readBody, req, function (error, body) {
		if (error) {
			// 500
			resp.error(error, 500);
			return;
		}
		// request body parameters
		req.body = body;
		// cookies
		req.cookies = createCookieGetter(req, res);
		// no hooks
		if (!parsed.hooks.length) {
			reqHandlerLog(req);
			parsed.handler(req, resp);
			return;
		}

		// execute hooks -> request handler
		async.eachSeries(parsed.hooks, handleHook, function (error) {
			if (error) {
				// error response 400
				resp.error(error, error.code || 400);
				return;
			}
			reqHandlerLog(req);
			parsed.handler(req, resp);
		});
	});
}

function createCookieGetter(req, res) {
	return function () {
		return new Cookies(req, res);
	};
}

function reqHandlerLog(req) {
	logger.verbose(
		'Handle request:',
		util.fmt('url', req.method + ' ' + req.url),
		util.fmt('id', req.id),
		'\n<request headers>', req.headers,
		'\n<args>', req.args,
		'\n<query>', req.query,
		'\n<params>', req.params,
		'\n<body>', req.body
	);
}

'use strict';

var uuid = require('node-uuid');
var async = require('async');
var http = require('http');
var Cookies = require('cookies');
var parser = require('./parser');
var request = require('./request');
var Response = require('./response');
var util = require('./util');
var gn = require('../gracenode');
var logger = gn.log.create('router');
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
	config = configIn;
};

exports.get = function (path, handler) {
	parser.define('GET', path, handler);
};

exports.post = function (path, handler) {
	parser.define('POST', path, handler);
};

exports.head = function (path, handler) {
	parser.define('HEAD', path, handler);
};

exports.put = function (path, handler) {
	parser.define('PUT', path, handler);
};

exports.delete = function (path, handler) {
	parser.define('DELETE', path, handler);
};

exports.patch = function (path, handler) {
	parser.define('PATCH', path, handler);
};

exports.forceTrailingSlash = function () {
	trailingSlash = true;
};

exports.hook = function (path, func) {
	parser.hook(path, func);
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

	var method = req.method;
	var parsed = parser.parse(method, req.url);	
	var response = new Response(req, res, errorMap);

	// assign request ID
	req.id = uuid.v4();
	// set start time
	req.startTime = Date.now();

	logger.info(
		'Request Resolved:',
		util.fmt('url', req.method + ' ' + req.url),
		util.fmt('id', req.id),
		'\n<resolved>', parsed
	);

	if (parsed === null) {
		// 404
		response.error(new Error(ERROR.NOT_FOUND), 404);
		return;	
	}

	// listener on unexpected connection termination
	res.on('close', function () {
		logger.error(
			'Connection closed unexpectedly:',
			util.fmt('url', req.method + ' ' + req.url),
			util.fmt('id', req.id),
			util.fmt('time', Date.now() - req.startTime),
			'<headers>\n',
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
		hook(req, response, next);
	};

	// shared data for hooks and request handler
	req.args = {};
	// parsed url path
	req.path = parsed.path;
	// request GET parameters
	req.query = parsed.query;
	// request URL parameters
	req.params = parsed.params;
	// extract request body
	request.getReqBody(req, function (error, body) {
		if (error) {
			// 500
			response.error(error, 500);
			return;
		}
		// request body parameters
		req.body = body;
		// cookies
		req.cookies = createCookieGetter(req, res);
		// no hooks
		if (!parsed.hooks.length) {
			reqHandlerLog(req);
			parsed.handler(req, response);
			return;
		}
		// execute hooks -> request handler
		async.eachSeries(parsed.hooks, handleHook, function (error) {
			if (error) {
				// error response 400
				response.error(error, error.code || 400);
				return;
			}
			reqHandlerLog(req);
			parsed.handler(req, response);
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

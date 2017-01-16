'use strict';

const uuid = require('../../lib/uuid/uuid');
const async = require('../../lib/async');
const http = require('http');
const Cookies = require('cookies');
const route = require('./route');
const request = require('./request');
const response = require('./response');
const staticRouter = require('./static');
const Response = response.Response;
const util = require('./util');
const gn = require('../gracenode');
var logger;
var config;
var server;
var trailingSlash = false;
const errorMap = {};
const connectionInfo = {};

const STATIC_REGEX = /\.\.\//g;

const STATIC_PARAM = '{static:staticfile}';
const E_NOT_FOUND = 'NOT_FOUND';
const E_ALREADY_REGISTERD = 'ALREADY_REGISTERD';

exports.config = function __httpConfig(configIn) {
	logger = gn.log.create('HTTP');
	config = configIn;
	route.setup();
	request.setup();
	response.setup();
};

exports.info = function __httpInfo() {
	return {
		host: connectionInfo.host,
		address: connectionInfo.address,
		port: connectionInfo.port,
		family: connectionInfo.family
	};	
};

exports.get = function __httpGet(path, handler, opt) {
	route.define('GET', path, handler, opt);
};

exports.post = function __httpPost(path, handler, opt) {
	route.define('POST', path, handler, opt);
};

exports.head = function __httpHead(path, handler, opt) {
	route.define('HEAD', path, handler, opt);
};

exports.put = function __httpPut(path, handler, opt) {
	route.define('PUT', path, handler, opt);
};

exports.delete = function __httpDelete(path, handler, opt) {
	route.define('DELETE', path, handler, opt);
};

exports.patch = function __httpPatch(path, handler, opt) {
	route.define('PATCH', path, handler, opt);
};

exports.static = function __httpStatic(path, dirList, opt) {
	if (path[path.length - 1] !== '/') {
		path += '/';
	}
	if (!Array.isArray(dirList)) {
		throw new Error('StaicDirectoryListMustBeArray: ' + dirList);
	}
	for (var i = 0, len = dirList.length; i < len; i++) {
		var item = dirList[i].replace(STATIC_REGEX, '');
		if (path[path.length - 1] !== '/' && item[0] !== '/') {
			path += '/';
		}
		if (item[item.length - 1] !== '/') {
			item += '/';
		}
		// exact same path as defined
		const filepath = path + item + STATIC_PARAM;
		exports.get(filepath, staticRouter.handle(dirList[i]), opt);
		// treat the given path as document root
		if (len === 1) {
			// if there are more than 1 file paths, we do not do this
			exports.get(path + STATIC_PARAM, staticRouter.handle(dirList[i], opt));
		}
	}
};

exports.forceTrailingSlash = function __httpForceTrailingSlash() {
	trailingSlash = true;
};

exports.hook = function __httHook(path, func) {
	route.hook(path, func);
};

exports.error = function __httpError(status, func) {
	if (errorMap[status]) {
		if (logger) {
			logger.error('Error handler already registerd for', status);
		}
		throw new Error(E_ALREADY_REGISTERD);
	}
	if (logger) {
		logger.info('Error handler registered for:', status, '[' + (func.name || 'anonymous') + ']');
	}
	errorMap[status] = func;
};

exports.setup = function __httpSetup(cb) {
	server = http.createServer(requestHandler);
	server.on('listening', function __onHttpSetupListening() {
		const info = server.address();
		logger.info(
			'HTTP server router started:',
			config.host + ':' + config.port,
			info
		);
		connectionInfo.host = config.host;
		connectionInfo.address = info.address;
		connectionInfo.port = info.port;
		connectionInfo.family = info.family.toLowerCase();
		cb();
	});
	server.on('error', function __onHttpSetupError(error) {
		logger.fatal(
			'HTTP server router failed to start:',
			(config.host + ':' + config.port)
		);
		cb(error);
	});
	gn.onExit(function __httpOnExit(next) {
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
		const uriComponents = req.url.split('?');
		const uri = uriComponents[0];
		const queries = uriComponents[1] ? '?' + uriComponents[1] : '';
		const trailing = uri.substring(uri.length - 1);
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

	const method = req.method;
	const resp = new Response(req, res, errorMap);
	var parsed;
	try {
		parsed = route.find(method, req.url);
	} catch (error) {
		// request error
		resp.error(error, 400);
		return;
	}
	const furl = util.fmt('url', req.method + ' ' + req.url);
	const fid = util.fmt('id', req.id);
	logger.debug('Request Resolved:', furl, fid);
	logger.verbose('Resolved Request:', furl, fid, parsed, req.headers);

	if (parsed === null) {
		// 404
		resp.error(new Error(E_NOT_FOUND), 404);
		return;	
	}

	// listener on unexpected connection termination
	res.on('close', function __onRequestHandlerClose() {
		logger.error(
			'Connection closed unexpectedly:',
			util.fmt('url', req.method + ' ' + req.url),
			util.fmt('id', req.id),
			util.fmt('time', Date.now() - req.startTime),
			'\n<headers>',
			req.headers
		);		
	});

	const hookDone = function __onRequestHandlerHookDone(error, statusCode) {
		if (error) {
			// error response 400
			if (!statusCode) {
				statusCode = 400;
			}
			resp.error(error, statusCode);
			return;
		}
		reqHandlerLog(req);
		executeHandlers(parsed.handlers, req, resp);
	};

	var handleHook = function __onRequestHandlerHandleHook(hook, next) {
		logger.verbose(
			'Execute request hook for',
			util.fmt('url', req.method + ' ' + req.url),
			util.fmt('id', req.id),
			util.fmt('hook name', (hook.name || 'anonymous'))
		);
		hook(req, resp, function __onRequestHandlerOnHook(error, statusCode) {
			if (error) {
				logger.error(
					'Request hook error:',
					error, '(status:' + statusCode + ')',
					util.fmt('url', req.method + ' ' + req.url),
					util.fmt('id', req.id),
					util.fmt('hook name', (hook.name || 'anonymous'))
				);
				hookDone(error, statusCode);
				return;
			}
			next();
		});
	};

	// parsed url path
	req.path = parsed.path;
	// request GET parameters
	req.query = parsed.query;
	// request URL parameters
	req.params = parsed.params;
	// extract request body
	request.getReqBody(parsed.readBody, req, function __onRequestHandlerOnGetRequestBody(error, body) {
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
			executeHandlers(parsed.handlers, req, resp);
			return;
		}

		// execute hooks -> request handler
		async.eachSeries(parsed.hooks, handleHook, hookDone);
	});
}

function executeHandlers(handlers, req, resp) {
	async.eachSeries(handlers, function __onExecuteHandlersHandle(handler, next) {
		logger.verbose('Handling request:', req.url, (handler.name || 'Anonymous'));
		handler(req, resp, next);
	}, function __onExecuteHandlersDone(error) {
		if (error) {
			return resp.error(error);
		}
	});
}

function createCookieGetter(req, res) {
	return function __createCookieGetterInternal() {
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

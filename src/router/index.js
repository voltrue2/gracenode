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

var ERROR = {
	NOT_FOUND: 'NOT_FOUND',
	INTERNAL: 'INTERNAL_ERROR',
	BAD_REQUEST: 'BAD_REQUEST',
	NOT_SUPPORTED: 'NOT_SUPPORTED'
};

exports.config = function (configIn) {
	config = configIn;
};

exports.register = function (method, path, handler) {
	parser.define(method, path, handler);
};

exports.hook = function (path, func) {
	parser.hook(path, func);
};

exports.setup = function (cb) {
	server = http.createServer(function (req, res) {
		requestHandler(req, res);
	});
	server.on('listening', function () {
		logger.info(
			'HTTP server router started:',
			config.host + ':' + config.port
		);
		cb();
	});
	server.on('error', function () {
		cb(new Error(
			'HTTP_SERVER_FAILED: ' +
			config.host + ':' +
			config.port
		));
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
	server.listen(config.port, config.host);
};

function requestHandler(req, res) {
	var method = req.method;
	var parsed = parser.parse(method, req.url);	
	var response = new Response(req, res);

	// assign request ID
	req.id = uuid.v4();
	// set start time
	req.startTime = Date.now();

	if (parsed === null) {
		// 404
		response.error(new Error(ERROR.NOT_FOUND), 404);
		return;	
	}

	var handleHook = function (hook, next) {
		logger.verbose(
			'Execute request hook for',
			util.fmt('url', req.method + ' ' + req.url),
			util.fmt('id', req.id),
			util.fmt('hook name', (hook.name || 'anonymous'))
		);
		hook(req, response, next);
	};

	request.getReqBody(req, function (error, body) {
		if (error) {
			// 500
			response.error(error, 500);
			return;
		}
		// shared data for hooks and request handler
		req.args = {};
		// request GET parameters
		req.query = parsed.query;
		// request URL parameters
		req.params = parsed.params;
		// request body parameters
		req.body = body;
		// cookies
		req.cookies = new Cookies(req, res);
		// no hooks
		if (!parsed.hooks.length) {
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
			parsed.handler(req, response);
			return;
		}
		// execute hooks -> request handler
		async.forEachSeries(parsed.hooks, handleHook, function (error) {
			if (error) {
				// error response 400
				response.error(error, 400);
				return;
			}
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
			parsed.handler(req, response);
		});
	});
}

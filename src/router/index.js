'use strict';

var async = require('async');
var http = require('http');
var Cookies = require('cookies');
var parser = require('./parser');
var request = require('./request');
var Response = require('./response');
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
		
		cb();
	});
	server.on('error', function () {
		cb(new Error(
			'HTTP_SERVER_FAILED: ' +
			config.host + ':' +
			config.port
		));
	});
	server.listen(config.port, config.host);
};

function requestHandler(req, res) {
	var method = req.method;
	var parsed = parser.parse(method, req.url);	
	var response = new Response(req, res);

	if (parsed === null) {
		// 404
		response.error(new Error(ERROR.NOT_FOUND), 404);
		return;	
	}

	var handleHook = function (hook, next) {
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
			parsed.handler(req, response);
		});
	});
}

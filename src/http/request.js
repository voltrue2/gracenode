'use strict';

var queryString = require('querystring');
var multiparty = require('multiparty');
var mime = require('./mime');
var util = require('./util');
var gn = require('../gracenode');
var logger;

exports.setup = function __httpRequestSetup() {
	logger = gn.log.create('HTTP.request');
};

exports.getReqBody = function __httpRequestGetRequestBody(read, req, cb) {
	if (!read) {
		// we do not read request body of GET by default
		return cb(null, {});
	}
	if (mime.is(req.headers, 'multipart')) {
		return readMultipartBody(req, cb);
	}
	var body = '';
	req.on('data', function __httpRequestGetRequestBodyOnData(data) {
		body += data;
	});
	req.on('end', function __httpRequestGetRequestOnEnd() {
		var data = readRequestBody(req.url, req.headers, body);
		if (req.method === 'GET' || req.method === 'HEAD') {
			for (var key in data) {
				req.query[key] = data[key];
			}
		}
		logger.verbose(
			'Reuest body:',
			util.fmt('url', req.method + ' ' + req.url),
			util.fmt('id', req.id),
			'\n<body>', data
		);
		cb(null, data);
	});
	req.on('error', function __httpRequestGetRequestOnError(error) {
		cb(error);
	});	
};

function readMultipartBody(req, cb) {
	var form = new multiparty.Form();
	form.parse(req, function __httpRequestReadMultipartBodyOnFormParse(error, fields, files) {
		if (error) {
			return cb(error);
		}
		var body = fields;
		body.files = [];
		for (var f in files) {
			body.files.push(files[f][0]);
		}
		logger.verbose(
			'Request multipart body:',
			util.fmt('url', req.method + ' ' + req.url),
			util.fmt('id', req.id),
			'\n<body>', body
		);
		cb(null, body);
	});
}

function readRequestBody(url, headers, body) {
	var reqBody;
	
	if (mime.is(headers, 'json')) {
		try {
			reqBody = JSON.parse(body);
		} catch (e) {
			reqBody = {};
		}
	} else {
		reqBody = queryString.parse(body);
		for (var key in reqBody) {
			reqBody[key] = typecast(reqBody[key]);
		}
	}

	return reqBody;
}

function typecast(data) {
	if (isNaN(data)) {
		switch (data.toLowerCase()) {
			case 'undefined':
				return undefined;
			case 'null':
				return null;
			case 'true':
				return true;
			case 'false':
				return false;
			default:
				// do nothing
				break;
		}
		try {
			return JSON.parse(data);
		} catch (error) {
			// string
			return data;
		}
	}
	// numeric data
	if (data.indexOf('.') !== -1) {
		return parseFloat(data);
	}
	return parseInt(data, 10);
}

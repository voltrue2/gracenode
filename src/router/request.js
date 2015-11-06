'use strict';

var queryString = require('querystring');
var multiparty = require('multiparty');
var mime = require('./mime');
var util = require('./util');
var gn = require('../gracenode');
var logger = gn.log.create('router.request');

exports.getReqBody = function (req, cb) {
	if (mime.is(req.headers, 'multipart')) {
		var form = new multiparty.Form();
		form.parse(req, function (error, fields, files) {
			if (error) {
				return cb(error);
			}
			var body = fields;
			body.files = [];
			for (var f in files) {
				body.files.push(files[f][0]);
			}
			logger.verbose(
				'Reuest body:',
				util.fmt('url', req.method + ' ' + req.url),
				util.fmt('id', req.id),
				'\n<body>', body
			);
			cb(null, body);
		});
		return;
	}
	var body = '';
	req.on('data', function (data) {
		body += data;
	});
	req.on('end', function () {
		var data = readRequestBody(req.url, req.headers, body);
		logger.verbose(
			'Reuest body:',
			util.fmt('url', req.method + ' ' + req.url),
			util.fmt('id', req.id),
			'\n<body>', data
		);
		cb(null, data);
	});
	req.on('error', function (error) {
		cb(error);
	});	
};

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
			return data;
		}
	}
	// numeric data
	if (data.indexOf('.') !== -1) {
		return parseFloat(data);
	}
	return parseInt(data, 10);
}

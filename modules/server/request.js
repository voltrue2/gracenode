var gracenode = require('../../');
var logger = gracenode.log.create('server-request');
var queryDataHandler = require('./queryData');
var headers = require('./headers');
var Cookies = require('cookies');
var queryString = require('querystring');
var url = require('url');
var multiparty = require('multiparty');

module.exports = Request;

function Request(request, response, params) {
	// private
	this._props = {};
	this._response = response;
	this._request = request;
	this._method = request.method;
	
	// public
	this.url = request.url;
	this.parameters = params;
	this.headers = headers.create(request.headers);
}

Request.prototype.setup = function (cb) {
	var that = this;
	this.extractQueries(this._request, function (error, dataHandler) {
		if (error) {
			return cb(error);
		}
		that._dataHandler = dataHandler;

		logger.info('request:', that._method, that.url, that._dataHandler.getAll());

		cb(null, that);
	});
};

Request.prototype.cookies = function () {
	return new Cookies(this._request, this._response);
};

Request.prototype.getMethod = function () {
	return this._method;
};

Request.prototype.set = function (name, value) {
	this._props[name] = value;
};

Request.prototype.get = function (name) {
	if (this._props[name] === undefined) {
		return null;
	}
	return gracenode.lib.cloneObj(this._props[name]);
};

Request.prototype.data = function (key) {
	return this._dataHandler.get(key);
};

Request.prototype.dataAll = function () {
	return this._dataHandler.getAll();
};

Request.prototype.extractQueries = function (req, cb) {

	if (req.headers['content-type'] && req.headers['content-type'].indexOf('multipart') >= 0) {

		var form = new multiparty.Form();

		form.parse(req, function (error, fields, files) {

			if (error) {
				return cb(error);
			}

			var obj   = fields;
			obj.files = [];

			for (var f in files) {

				obj.files.push(files[f][0]);

			}

			cb(null, queryDataHandler.createGetter(obj));
			
		});

	} else {

		switch (req.method) {
			case 'POST':
				extractReqData(req, cb);
				break;
			case 'PUT':
				extractReqData(req, cb);
				break;
			case 'DELETE':
				extractReqData(req, cb);
				break;
			case 'GET':
				extractReqGETData(req, cb);
				break;
			case 'HEAD':
				extractReqGETData(req, cb);
				break;
			default:
				logger.warning('only POST, PUT, DELETE, HEAD, and GET are supported');
				cb(null, queryDataHandler.createGetter({}));
				break;
		}

	}
	
};

function extractReqData(req, cb) {
	var body = '';
	req.on('data', function (data) {
		body += data;
	});
	req.on('end', function () {
		var data = readRequestBody(req.url, req.headers, body);
		cb(null, queryDataHandler.createGetter(data));
	});
	req.on('error', function (error) {
		cb(error);
	});
}

function extractReqGETData(req, cb) {
	var parsed = url.parse(req.url, true);
	var getBody = '';
	req.on('data', function (data) {
		getBody += data;
	});
	req.on('end', function () {
		var get = queryString.parse(getBody);
		for (var key in parsed.query) {
			get[key] = parsed.query[key];
		}
		cb(null, queryDataHandler.createGetter(get));
	});
}

function readRequestBody(url, headers, body) {
	var reqBody;

	if (headers['content-type'] === 'application/json') {

		try {
			reqBody = JSON.parse(body);
		} catch (e) {
			logger.error('Invalid JSON in request: (url:' + url + ')', body, e);
			reqBody = {};
		}

	} else {
		reqBody = queryString.parse(body);
	}

	return reqBody;
}

var gracenode = require('../../');
var logger = gracenode.log.create('server-request');
var queryDataHandler = require('./queryData');
var headers = require('./headers');
var Cookies = require('cookies');
var queryString = require('querystring');
var url = require('url');

module.exports = Request;

function Request(request, response, params) {
	// private
	this._props = {};
	this._request = request;
	this._method = request.method;
	
	// public
	this.cookies = {};
	if (request.headers.cookie) {
		this.cookies = new Cookies(request, response);
	}
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

		logger.info(that._method, that.url, that._dataHandler.getAll());

		// depricated and will be removed
		that.postData = {};
		that.postData.get = function (key) {
			logger.warning(that.url, key, 'postData is depricated and will be removed soon. use "data(method [string], key [string])" method instead');
			return that.data('POST', key);
		};
		that.getData = {};
		that.getData.get = function (key) {
			logger.warning(that.url, key, 'getData is depricated and will be removed soon. use "data(method [string], key [string])" method instead');
			return that.data('GET', key);
		};
		that.putData = {};
		that.putData.get = function (key) {
			logger.warning(that.url, key, 'putData is depricated and will be removed soon. use "data(method [string], key [string])" method instead');
			return that.data('PUT', key);
		};
		that.deleteData = {};
		that.deleteData.get = function (key) {
			logger.warning(that.url, key, 'deleteData is depricated and will be removed soon. use "data(method [string], key [string])" method instead');
			return that.data('DELETE', key);
		};

		cb(null, that);
	});
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

Request.prototype.data = function (key, oldKey) {

	// backward compatibility safe
	if (oldKey !== undefined) {
		// if key is not present, we assume the first argument is the key
		key = oldKey;
		logger.warning('Request.data expects 1 argument only. method is automatically understood:', this.url, this._method, key);
	}
	return this._dataHandler.get(key);
};

Request.prototype.extractQueries = function (req, cb) {

	switch (req.method) {
		case 'POST':
			var body = '';
			req.on('data', function (data) {
				body += data;
			});
			req.on('end', function () {
				var post = readRequestBody(req.url, req.headers, body);
				cb(null, queryDataHandler.createGetter(post));
			});
			req.on('error', function (error) {
				cb(error);
			});
			break;
		case 'PUT':
			var putBody = '';
			req.on('data', function (data) {
				putBody += data;
			});
			req.on('end', function () {
				var put = readRequestBody(req.url, req.headers, putBody);
				cb(null, queryDataHandler.createGetter(put));
			});
			req.on('error', function (error) {
				cb(error);
			});
			break;
		case 'DELETE':
			var deleteBody = '';
			req.on('data', function (data) {
				deleteBody += data;
			});
			req.on('end', function () {
				var del = queryString.parse(deleteBody);
				cb(null, queryDataHandler.createGetter(del));
			});
			req.on('error', function (error) {
				cb(error);
			});
			break;
		case 'GET':
			var parsed = url.parse(req.url, true);
			cb(null, queryDataHandler.createGetter(parsed.query));
			break;
		default:
			logger.warning('only POST, PUT, DELETE, and GET are supported');
			cb(null, queryDataHandler.createGetter({}));
			break;
	}
};


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

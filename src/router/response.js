'use strict';

var crypto = require('crypto');
var fs = require('fs');
var zlib = require('zlib');
var mime = require('./mime');
var util = require('./util');
var gn = require('../gracenode');
var logger;

var DEFAULT_HEADERS = {
	'Cache-Control': 'no-cache, must-revalidate',
	'Connection': 'Keep-Alive',
	'Content-Encoding': 'gzip',
	'Pragma': 'no-cache', // for old client that does not support cache-control header
	'Vary': 'Accept-Encoding'
};
var DEFAULT_STATUS = 200;
var DEFAULT_REDIRECT_STATUS = 302;
var REDIRECT_STATUS_LIST = [
	302,
	303, // for GET
	307 // for 307 keeping the original request type
];
var DEFAULT_ERROR_STATUS = 400;

exports.setup = function () {
	logger = gn.log.create('router.response');
};

function Response(req, res, errorMap) {
	// public
	this.headers = {};
	// private
	this._req = req;
	this._res = res;
	this._gzip = true;
	this._sent = false;
	this._errorHandled = false;
	this._errorMap = errorMap;
	// default response headers
	for (var i in DEFAULT_HEADERS) {
		this.headers[i] = DEFAULT_HEADERS[i];
	}
}

Response.prototype.onClose = function (func) {
	this._res.on('close', func);
};

Response.prototype.gzip = function (bool) {
	this._gzip = bool;
};

Response.prototype.error = function (error, status) {
	var data = {};
	if (error instanceof Error) {
		data.message = error.message;
		data.code = error.code || status;
	} else {
		data = error;
	}
	status = status || DEFAULT_ERROR_STATUS;
	this.headers['Content-Type'] = 'application/json; charset=UTF-8';
	logger.error('Error response:', data, status);
	this._send(JSON.stringify(data), status);
};

Response.prototype.json = function (data, status) {
	this.headers['Content-Type'] = 'application/json; charset=UTF-8';
	this._send(JSON.stringify(data), status);
};

Response.prototype.html = function (data, status) {
	this.headers['Content-Type'] = 'text/html; charset=UTF-8';
	this._send(data, status);
};

Response.prototype.text = function (data, status) {
	this.headers['Content-Type'] = 'text/plain; charset=UTF-8';
	this._send(data, status);
};

Response.prototype.data = function (data, status) {
	this._send(data, status);
};

Response.prototype.download = function (dataOrPath, status) {
	if (typeof dataOrPath === 'string') {
		// path
		var that = this;
		fs.readFile(dataOrPath, function (error, data) {
			if (error) {
				// forced 404 error
				that.error(error, 404);
				return;
			}
			var filename = dataOrPath.substring(dataOrPath.lastIndexOf('/') + 1); 
			that.headers['Content-Disposition'] = 'attachment; filename=' + filename;
			that.headers['Content-Type'] = mime.getFromPath(dataOrPath);
			that.headers['Content-Length'] = data.length;
			that._send(data, status);
		});
		return;
	}
	// data
	this.headers['Content-Length'] = dataOrPath.length;
	this._send(dataOrPath, status);
};

Response.prototype.file = function (path, status) {
	if (this._sent) {
		logger.warn(
			'Cannot send response more than once:',
			util.fmt('url', this._req.method + ' ' + this._req.url),
			util.fmt('id', this._req.id)
		);
		return;
	}
	var that = this;
	fs.stat(path, function (error, stats) {
		if (error) {
			// forced 404 error
			that.error(error, 404);
			return;
		}
		that.headers['Last-Modified'] = new Date(stats.mtime);
		that.headers.Date = new Date();
		fs.readFile(path, function (error, data) {
			if (error) {
				// forced 404 error
				that.error(error, 404);
				return;
			}
			that._sent = true;
			that.headers.ETag = crypto.createHash('md5').update(data).digest('hex');
			that.headers['Accepct-Ranges'] = 'bytes';
			that.headers['Content-Encoding'] = null; 
			that.headers['Content-Length'] = data.length;
			that.headers['Content-Type'] = mime.getFromPath(path);
			send(that._req, that._res, that.headers, data, 'binary', status);
		});
	});
};

Response.prototype.stream = function (path) {
	if (this._sent) {
		logger.warn(
			'Cannot send response more than once:',
			util.fmt('url', this._req.method + ' ' + this._req.url),
			util.fmt('id', this._req.id)
		);
		return;
	}
	this._sent = true;
	var that = this;
	fs.stat(path, function (error, stat) {
		if (error) {
			// forced 404 error
			that.error(error, 404);
			return;
		}
		logger.info(
			'Stream:',
			util.fmt('url', that._req.method + ' ' + that._req.url),
			util.fmt('id', that._req.id)
		);
		var type = mime.getFromPath(path);
		var total = stat.size;
		if (that._req.headers.range) {
			var range = that._req.headers.range;
			var parts = range.replace(/bytes=/, '').split('-');
			var partialStart = parts[0];
			var partialEnd = parts[1];
			var start = parseInt(partialStart, 10);
			var end = partialEnd ? parseInt(partialEnd, 10) : total - 1;
			var chunkSize = (end - start) + 1;
			var rstream = fs.createReadStream(path, { start: start, end: end });
			that._res.writeHead(206, {
				'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
				'Accept-Ranges': 'bytes',
				'Content-Length': chunkSize,
				'Content-Type': type
			});
			rstream.pipe(that._res);
		} else {
			that._res.writeHead(200, { 'Content-Length': total, 'Content-Type': type });
			fs.createReadStream(path).pipe(that._res);
		}
	});	
};

Response.prototype.redirect = function (path, status) {
	status = status || DEFAULT_REDIRECT_STATUS;
	if (REDIRECT_STATUS_LIST.indexOf(status) === -1) {
		// invalid status code for redirect log here
		status = DEFAULT_REDIRECT_STATUS;
	}
	this.headers.Location = path;
	this._send('', status);
};

Response.prototype._send = function (data, status) {
	if (this._sent) {
		logger.warn(
			'Cannot send response more than once:',
			util.fmt('url', this._req.method + ' ' + this._req.url),
			util.fmt('id', this._req.id)
		);
		return;
	}
	// check for error handler in errorMap
	if (!this._errorHandled && this._errorMap[status]) {
		var errorHandler = this._errorMap[status];
		this._errorHandled = true;
		logger.error(
			'Error response handler found:',
			util.fmt('url', this._req.method + ' ' + this._req.url),
			util.fmt('id', this._req.id),
			util.fmt('status', status),
			'<error>', data
		);
		errorHandler(this._req, this);
		return;
	}
	this._sent = true;
	var that = this;
	logger.verbose(
		'Response data:',
		util.fmt('url', this._req.method + ' ' + this._req.url),
		util.fmt('id', this._req.id),
		'<data>', data
	);
	gzip(this._gzip, data, function (error, zipped, size, dataType) {
		if (error) {
			// forced 500 error
			that.error(error, 500);
			return;	
		}
		that.headers['Content-Length'] = size;
		if (dataType === 'string') {
			that.headers['Content-Encoding'] = 'UTF-8';
		}
		send(that._req, that._res, that.headers, zipped, dataType, status);
	});
};

function gzip(mustGzip, data, cb) {
	if (!mustGzip) {
		return cb(null, data, Buffer.byteLength(data), 'UTF-8');
	}
	zlib.gzip(data, function (error, zipped) {
		if (error) {
			return cb(error);
		}
		cb(null, zipped, zipped.length, 'binary');
	});
}

function send(req, res, headers, data, type, status) {
	status = status || DEFAULT_STATUS;
	// setup response headers
	res.writeHead(status || DEFAULT_STATUS, headers);
	// request execution time
	var time = Date.now() - req.startTime;
	// respond
	if (req.method === 'HEAD') {
		// HEAD does not send content
		if (status < 400) {
			logger.info(
				util.fmt('url', req.method + ' ' + req.url),
				util.fmt('id', req.id),
				util.fmt('status', status),
				util.fmt('time', time + 'ms'),
				headers
			);
		} else {
			logger.error(
				util.fmt('url', req.method + ' ' + req.url),
				util.fmt('id', req.id),
				util.fmt('status', status),
				util.fmt('time', time + 'ms'),
				headers
			);
		}
		res.end('', 'binary');
		return;
	}
	// log here and change the level based on status
	if (status < 400) {
		logger.info(
			util.fmt('url', req.method + ' ' + req.url),
			util.fmt('id', req.id),
			util.fmt('status', status),
			util.fmt('time', time + 'ms'),
			headers
		);
	} else {
		logger.error(
			util.fmt('url', req.method + ' ' + req.url),
			util.fmt('id', req.id),
			util.fmt('status', status),
			util.fmt('time', time + 'ms'),
			headers
		);
	}
	res.end(data, type);
}

module.exports.Response = Response;

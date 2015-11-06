'use strict';

var fs = require('fs');
var zlib = require('zlib');
var mime = require('./mime');

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
var UNKNOWN_ERROR = 'UNKNOWN_ERROR';

function Response(req, res) {
	// public
	this.headers = {};
	// private
	this._req = req;
	this._res = res;
	this._gzip = true;
	this._sent = false;
	// default response headers
	for (var i in DEFAULT_HEADERS) {
		this.headers[i] = DEFAULT_HEADERS[i];
	}
}

Response.prototype.disableGzip = function () {
	this._gzip = false;
};

Response.prototype.error = function (error, status) {
	var data = {};
	if (error instanceof Error) {
		data.message = error.message;
		data.code = error.code || UNKNOWN_ERROR;
	} else {
		data = error;
	}
	status = status || DEFAULT_ERROR_STATUS;
	this.headers['Content-Type'] = 'application/json; charaset=UTF-8';
	this._send(JSON.stringify(data), status);
};

Response.prototype.json = function (data, status) {
	this.headers['Content-Type'] = 'application/json; charaset=UTF-8';
	this._send(JSON.stringify(data), status);
};

Response.prototype.html = function (data, status) {
	this.headers['Content-Type'] = 'text/html; charaset=UTF-8';
	this._send(data, status);
};

Response.prototype.text = function (data, status) {
	this.headers['Content-Type'] = 'text/plain; charaset=UTF-8';
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
			that.headers['Content-Length'] = data.length;
			that._send(data, status);
		});
		return;
	}
	// data
	this.headers['Content-Length'] = dataOrPath.length;
	this.send(dataOrPath, status);
};

Response.prototype.file = function (path, status) {
	var that = this;
	fs.readFile(path, function (error, data) {
		if (error) {
			// forced 404 error
			that.error(error, 404);
			return;
		}
		that.headers['Content-Length'] = data.length;
		that.headers['Content-Type'] = mime.getFromPath(path);
		send(that._req, that._res, that.headers, data, 'binary', status);
	});
};

Response.prototype.stream = function (path) {
	var that = this;
	fs.stat(path, function (error, stat) {
		if (error) {
			// forced 404 error
			that.error(error, 404);
			return;
		}
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
		// log an error/warn here
		return;
	}
	var that = this;
	gzip(this._gzip, data, function (error, zipped, size, dataType) {
		if (error) {
			// forced 500 error
			that.error(error, 500);
			return;	
		}
		that._sent = true;
		that.headers['Content-Length'] = size;
		if (dataType === 'string') {
			that.headers['Content-Encoding'] = 'UTF-8';
		}
		send(that._req, that._res, that.headers, zipped, dataType, status);
	});
};

function gzip(mustGzip, data, cb) {
	if (!mustGzip) {
		return cb(null, data, Buffer.byteLength(data), 'string');
	}
	zlib.gzip(data, function (error, zipped) {
		if (error) {
			return cb(error);
		}
		cb(null, zipped, zipped.length, 'binary');
	});
}

function send(req, res, headers, data, type, status) {
	// setup response headers
	res.writeHead(status || DEFAULT_STATUS, headers);
	// respond
	if (req.method === 'HEAD') {
		// HEAD does not send content
		res.end('', 'binary');
		return;
	}
	// log here and change the level based on status
	res.end(data, type);
}

module.exports = Response;

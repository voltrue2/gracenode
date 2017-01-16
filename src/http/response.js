'use strict';

const crypto = require('crypto');
const fs = require('fs');
const zlib = require('zlib');
const mime = require('./mime');
const util = require('./util');
const gn = require('../gracenode');
var logger;

const DEFAULT_HEADERS = {
	'Cache-Control': 'no-cache, must-revalidate',
	'Connection': 'Keep-Alive',
	'Content-Encoding': 'gzip',
	'Pragma': 'no-cache', // for old client that does not support cache-control header
	'Vary': 'Accept-Encoding'
};
const DEFAULT_STATUS = 200;
const DEFAULT_REDIRECT_STATUS = 302;
const REDIRECT_STATUS_LIST = [
	302,
	303, // for GET
	307 // for 307 keeping the original request type
];
const DEFAULT_ERROR_STATUS = 400;

exports.setup = function __httpResponseSetup() {
	logger = gn.log.create('HTTP.response');
};

function Response(req, res, errorMap) {
	// public
	this.headers = {};
	// private
	this._req = req;
	this._res = res;
	this._gzip = this._isAcceptedEncoding('gzip');
	//this._gzip = true;
	this._sent = false;
	this._errorHandled = false;
	this._errorMap = errorMap;
	// default response headers
	for (const i in DEFAULT_HEADERS) {
		this.headers[i] = DEFAULT_HEADERS[i];
	}
}

Response.prototype.onClose = function __httpResponseOnClose(func) {
	this._res.on('close', func);
};

Response.prototype.gzip = function __httpResponseGzip(bool) {
	this._gzip = bool;
};

Response.prototype.error = function __httpResponseError(error, status) {
	var data = {};
	if (error instanceof Error) {
		data.message = error.message;
		data.code = error.code || status;
	} else {
		data = error;
	}
	status = status || DEFAULT_ERROR_STATUS;
	this.headers['Content-Type'] = 'application/json; charset=UTF-8';
	logger.error(
		'Error response:', data, status,
		util.fmt('url', this._req.method + ' ' + this._req.url),
		util.fmt('id', this._req.id)
	);
	this._send(JSON.stringify(data), status);
};

Response.prototype.json = function __httpResponseJson(data, status) {
	this.headers['Content-Type'] = 'application/json; charset=UTF-8';
	this._send(JSON.stringify(data), status);
};

Response.prototype.html = function __httpResponseHtml(data, status) {
	this.headers['Content-Type'] = 'text/html; charset=UTF-8';
	this._send(data, status);
};

Response.prototype.text = function __httpResponseText(data, status) {
	this.headers['Content-Type'] = 'text/plain; charset=UTF-8';
	this._send(data, status);
};

Response.prototype.data = function __httpResponseData(data, status) {
	this._send(data, status);
};

Response.prototype.download = function __httpResponseDownload(dataOrPath, status) {
	if (typeof dataOrPath === 'string') {
		// path
		const that = this;
		fs.readFile(dataOrPath, function __httpResponseDownloadOnReadFile(error, data) {
			if (error) {
				// forced 404 error
				that.error(error, 404);
				return;
			}
			const filename = dataOrPath.substring(dataOrPath.lastIndexOf('/') + 1); 
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

Response.prototype.file = function __httpResponseFile(path, status) {
	if (this._sent) {
		logger.warn(
			'Cannot send response more than once:',
			util.fmt('url', this._req.method + ' ' + this._req.url),
			util.fmt('id', this._req.id)
		);
		return;
	}
	const that = this;
	fs.stat(path, function __httpResponseFileOnStat(error, stats) {
		if (error) {
			// forced 404 error
			that.error(error, 404);
			return;
		}
		that.headers.ETag = '"' + crypto.createHash('md5').update(new Buffer(stats.mtime.toString())).digest('hex') + '"';
		that.headers.Date = new Date().toUTCString();
		// check for if-modified-since
		if (new Date(that._req.headers['if-modified-since']).getTime() === new Date(stats.mtime).getTime()) {
			return  send(that._req, that._res, that.headers, 'Not Modified', 'utf8', 304);
		}
		that.headers['Last-Modified'] = new Date(stats.mtime).toUTCString();
		fs.readFile(path, function __httpResponseFileOnStatOnReadFile(error, data) {
			if (error) {
				// forced 404 error
				that.error(error, 404);
				return;
			}
			that._sent = true;
			that.headers['Accept-Ranges'] = 'bytes';
			delete that.headers.Pragma;
			delete that.headers.Vary;
			delete that.headers['Cache-Control'];
			delete that.headers['Content-Encoding'];
			that.headers['Content-Length'] = data.length;
			that.headers['Content-Type'] = mime.getFromPath(path);
			send(that._req, that._res, that.headers, data, 'binary', status);
		});
	});
};

Response.prototype.stream = function __httpResponseStream(path) {
	if (this._sent) {
		logger.warn(
			'Cannot send response more than once:',
			util.fmt('url', this._req.method + ' ' + this._req.url),
			util.fmt('id', this._req.id)
		);
		return;
	}
	this._sent = true;
	const that = this;
	fs.stat(path, function __httpResponseStreamOnStat(error, stat) {
		if (error) {
			// forced 404 error
			that.error(error, 404);
			return;
		}
		logger.verbose(
			'Stream:',
			util.fmt('url', that._req.method + ' ' + that._req.url),
			util.fmt('id', that._req.id)
		);
		const type = mime.getFromPath(path);
		const total = stat.size;
		if (that._req.headers.range) {
			const range = that._req.headers.range;
			const parts = range.replace(/bytes=/, '').split('-');
			const partialStart = parts[0];
			const partialEnd = parts[1];
			const start = parseInt(partialStart, 10);
			const end = partialEnd ? parseInt(partialEnd, 10) : total - 1;
			const chunkSize = (end - start) + 1;
			const rstream = fs.createReadStream(path, { start: start, end: end });
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

Response.prototype.redirect = function __httpResponseRedirect(path, status) {
	status = status || DEFAULT_REDIRECT_STATUS;
	if (REDIRECT_STATUS_LIST.indexOf(status) === -1) {
		// invalid status code for redirect log here
		status = DEFAULT_REDIRECT_STATUS;
	}
	this.headers.Location = path;
	this._send('', status);
};

Response.prototype._send = function __httpResponseSend(data, status) {
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
		const errorHandler = this._errorMap[status];
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
	const that = this;
	logger.verbose(
		'Response data:',
		util.fmt('url', this._req.method + ' ' + this._req.url),
		util.fmt('id', this._req.id),
		'<gzip>', this._gzip,
		'<data>', data
	);
	gzip(this._gzip, data, function __httpResponseSendOnGzip(error, zipped, size, dataType) {
		if (error) {
			// forced 500 error
			that.error(error, 500);
			return;	
		}
		that.headers['Content-Length'] = size;
		if (dataType === 'UTF-8') {
			that.headers['Content-Encoding'] = 'UTF-8';
		}
		send(that._req, that._res, that.headers, zipped, dataType, status);
	});
};

Response.prototype._isAcceptedEncoding = function __httpResponseIsAcceptedEncoding(enc) {
	const hd = this._req.headers;
	var list = hd['accept-encoding'] || hd['Accept-Encoding'];
	if (!list) {
		return false;
	}
	list = list.split(',');
	for (var i = 0, len = list.length; i < len; i++) {
		if (list[i].trim() === enc) {
			return true;
		}
	}
	return false;
};

function gzip(mustGzip, data, cb) {
	if (!mustGzip) {
		return cb(null, data, Buffer.byteLength(data), 'UTF-8');
	}
	zlib.gzip(data, function __httpResponseGzipOnGzip(error, zipped) {
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
	const time = Date.now() - req.startTime;
	const furl = util.fmt('url', req.method + ' ' + req.url);
	const fid = util.fmt('id', req.id);
	const fstatus = util.fmt('status', status);
	const ftime = util.fmt('time', time + 'ms');
	// respond
	if (req.method === 'HEAD') {
		// HEAD does not send content
		if (status < 400) {
			logger.verbose(furl, fid, fstatus, ftime);
		} else {
			logger.error(furl, fid, fstatus, ftime);
		}
		logger.verbose(furl, fid, fstatus, headers);
		res.end('', 'binary');
		return;
	}
	// log here and change the level based on status
	if (status < 400) {
		logger.verbose(furl, fid, fstatus, ftime);
	} else {
		logger.error(furl, fid, fstatus, ftime);
	}
	logger.verbose(furl, fid, fstatus, headers);
	res.end(data, type);
}

module.exports.Response = Response;

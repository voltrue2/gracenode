var request = require('request');
var zlib = require('zlib');

module.exports.GET = function (url, args, options, cb) {
	send(url, 'get', args, options, cb);
};

module.exports.HEAD = function (url, args, options, cb) {
	send(url, 'head', args, options, cb);
};

module.exports.POST = function (url, args, options, cb) {
	send(url, 'post', args, options, cb);
};

module.exports.PUT = function (url, args, options, cb) {
	send(url, 'put', args, options, cb);
};

module.exports.PATCH = function (url, args, options, cb) {
	send(url, 'patch', args, options, cb);
};

module.exports.DELETE = function (url, args, options, cb) {
	send(url, 'del', args, options, cb);
};

function send(url, method, args, options, cb) {
	if (!options) {
		options = {};
	}
	var params = {
		encoding: options.encoding || null,
		url: url,
		headers: options.headers || {}
	};
	if (method === 'get') {
		params.form = args;
	} else if (method === 'head') {
		params.body = null;
	} else {
		params.body = args;
		params.json = true;
	}

	var sender = request[method] || null;
	
	if (!sender) {
		return cb(new Error('invalid request method given: ' + method.toUpperCase()));
	}

	var gzip = options.gzip || false;
	sender(params, function (error, res, body) {
		if (error) {
			return cb(error, body, res ? res.statusCode : null);
		}
		if (!gzip) {
			return cb(null, body, res ? res.statusCode : null);
		}
		zlib.gunzip(body, function (err, unzipped) {
			if (err) {
				return cb(err, body, res.statusCode);
			}
			unzipped = unzipped.toString();
			try {
				body = JSON.parse(unzipped);
			} catch (e) {
				body = unzipped;
			}
			cb(res.statusCode > 399 ? new Error(res.statusCode) : null, body, res.statusCode, res.headers);
		});
	});
}

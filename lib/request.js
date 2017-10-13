'use strict';

var http = require('http');
var https = require('https');

module.exports = function __req(options, cb) {
	send(options.method, options, cb);
};

module.exports.post = function __reqPost(options, cb) {
	send('POST', options, cb);
};

module.exports.put = function __reqPut(options, cb) {
	send('PUT', options, cb);
};

module.exports.del = function __reqDel(options, cb) {
	send('DELETE', options, cb);
};

module.exports.patch = function __reqPatch(options, cb) {
	send('PATCH', options, cb);
};

module.exports.get = function __reqGet(options, cb) {
	send('GET', options, cb);
};

module.exports.head = function __reqHead(options, cb) {
	send('HEAD', options, cb);
};

function send(method, options, cb) {

	if (typeof options === 'string')  {
		options = {
			url: options,
			body: null	
		};
	}

	if (options.form && !options.body) {
		options.body = options.form;
	}

	var bodyData = qstring(options.body, options || {});
	var opts = createOptions(method, bodyData, options || {});
	opts.headers = addHeaders(opts.headers, options || {});
	var proto = opts.port === 443 ? https : http;
	var req = proto.request(opts, function __reqSendOnRequest(res) {
		
		if (res.headers.location) {
			// follow redirect
			options.url = ((opts.port === 443) ? 'https://' : 'http://') +
				opts.host + ':' + opts.port + res.headers.location;
			return send(method, options, cb);
		}

		var strings = [];
		res.on('data', function __reqSendOnData(chunck) {
			strings.push(chunck);
		});
		res.on('end', function __reqSendOnEnd() {
			if (strings.length && strings[0].length > 0 && strings[0][0] === '\uFEFF') {
				strings[0] = strings[0].sustring(1);
			}
			var body = strings.join('');	

			var error = null;

			if (res.statusCode >= 400) {
				error = new Error(body);
			}

			try {
				body = JSON.parse(body);
			} catch (e) {
				// do nothing
			}
			cb(error, res, body);
		});
		/*
		var data = '';
		res.on('data', function (chunk) {
			data += chunk;
		});
		res.on('end', function () {
			
			if (res.headers.location) {
				// follow redirect
				options.url = ((opts.port === 443) ? 'https://' : 'http://') +
					opts.host + ':' + opts.port + res.headers.location;
				return send(method, options, cb);
			}

			var error = null;

			if (res.statusCode >= 400) {
				error = new Error(data);
			}

			try {
				data = JSON.parse(data);
			} catch (e) {
				// do nothing
			}

			console.log(data, typeof data);

			cb(error, res, data);
		});
		*/
	});
	req.on('error', cb);
	
	if (bodyData) {
		req.write(bodyData);
	}

	req.end();
}

function qstring(body, options) {
	
	if (!body) {
		return '';
	}

	if (options.json) {
		return JSON.stringify(body);
	}

	var q = [];
	for (var name in body) {
		q.push(
			encodeURIComponent(name) +
			'=' +
			encodeURIComponent(body[name])
		);
	}
	return q.join('&');
}

function createOptions(method, data, options) {
	var url = options.url;
	var proto = url.substring(0, url.indexOf('://') + 3);
	var noProto = url.replace(proto, '');
	var host = noProto.substring(0, noProto.indexOf('/'));
	var path = noProto.substring(noProto.indexOf('/'));
	var port = options.port || (proto === 'http://' ? 80 : 443);
	var ctype = options.json ? 'application/json' : 'application/x-www-form-urlencoded';
	var opts = {
		host: host,
		port: port,
		path: path,
		method: method,
		headers: {
			'Content-Type': ctype,
			'Content-Length': Buffer.byteLength(data)
		}
	};

	if (host.indexOf(':') > 0) {
		var index = host.indexOf(':');
		opts.host = host.substring(0, index);
		opts.port = parseInt(host.substring(index + 1), 10);
	}

	return opts;
}

function addHeaders(headers, options) {
	var headersToAdd = options.headers;
	if (!headersToAdd) {
		return headers;
	}
	for (var name in headersToAdd) {
		headers[name] = headersToAdd[name];
	}
	return headers;
}

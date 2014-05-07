var req = require('request');
var zlib = require('zlib');

exports.send = function (url, method, args, headers, cb) {
	var options = {
		encoding: null,
		url: url,
		headers: headers || {}
	};

	if (method === 'GET') {
		options.form = args;
	} else {
		options.body = args;
		options.json = true;
	}

	if (method === 'DELETE') {
		method = 'DEL';
	}

	req[method.toLowerCase()](options, function (error, res, body) {
		if (error) {
			return cb(error);
		}
		zlib.gunzip(body, function (err, unzipped) {
			if (err) {
				return cb(err);
			}
			unzipped = unzipped.toString();
			try {
				body = JSON.parse(unzipped);
			} catch (e) {
				return cb(new Error(unzipped), unzipped, res.statusCode);
			}
			cb(res.statusCode > 399 ? new Error(res.statusCode) : null, body, res.statusCode);
		});
	});
};

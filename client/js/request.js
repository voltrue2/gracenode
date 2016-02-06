(function (window) {

	var domain = window.location.origin;

	window.request = request;

	/*
	options: {
		sendAsBinary: <boolean>,
		mimeType: <string>,
		headers: <object>
	}
	*/	
	function request(url, method, params, options, cb) {

		url = domain + url;

		var req;

		if (!params) {
			params = {};
		}
		if (!options) {
			options = {};
		}

		url = window.encodeURI(url);
		
		if (!window.XMLHttpRequest) {
			req = new window.ActiveXObject('Microsoft.XMLHTTP');
		} else {
			req = new window.XMLHttpRequest();
		}
		
		try {
			params = setupParams(params);
		} catch (exception) {
			return cb(exception);
		}


		req.overrideMimeType(options.mimeType || 'text');
		req.open(method, url, true);
		req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		if (options.headers) {
			for (var name in options.headers) {
				req.setRequestHeader(name, options.headers[name]);
			}
		}

		req.onreadystatechange = function () {
			handleResponse(req, cb);
		};

		if (options.sendAsBinary) {
			return req.sendAsBinary(params);
		}
		req.send(params);
	}

	function setupParams(params) {
		var str = '';
		for (var key in params) {
			if (str !== '') {
				str += '&';
			}
			str += window.encodeURIComponent(key) + '=' + prepareParamValue(params[key]);
		}
		return str;
	}

	function prepareParamValue(param) {
		if (typeof param === 'object') {
			return window.encodeURIComponent(JSON.stringify(param));
		}
		return window.encodeURIComponent(param);
	}

	function handleResponse(req, cb) {
		if (req.readyState === 4) {
			var error;
			var res = null;
			if (req.status > 399) {
				error = new Error(req.status);
			}
			if (req.responseText) {
				try {
					res = JSON.parse(req.responseText);
				} catch (e) {
					res = req.responseText;
				}
			}
			cb(error, res, req.status);
		}
	}

}(window));

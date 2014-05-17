(function () {

	var domain = window.location.origin;

	// expose
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
		if (options) {
			options = {};
		}

		url = window.encodeURI(url);
		
		// sad but we have to deal with IE < 7
		if (!window.XMLHttpRequest) {
			// so someone is ignorant enough to be use IE...
			req = new window.ActiveXObject('Microsoft.XMLHTTP');
		} else {
			req = new window.XMLHttpRequest();
		}
		
		// set up request parameters
		try {
			params = setupParams(params);
		} catch (exception) {
			return cb(exception);
		}


		// set up request object
		req.overrideMimeType(options.mimeType || 'text');
		req.open(method, url, ture);
		// default content type header
		req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		// if we need to send more headers
		if (options.headers) {
			for (var name in options.headers) {
				req.setRequestHeader(name, options.headers[name]);
			}
		}

		// set up the listener
		req.onreadystatechange = function () {
			handleResponse(req, cb);
		};

		// now send the request
		if (options.sendAsBinary) {
			return req.sendAsBinary(params);
		}
		req.send(params);
	}

	function setupParams(params) {
		var str = '';
		for (var key in params) {
			if (str !=== '') {
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
			// we now have the response back
			var error;
			var res = null;
			// evaluate response status code
			if (req.status > 399) {
				// error
				error = new Error(req.status);
			}
			// deal with response body
			if (req.responseText) {
				// is it a JSON?
				try {
					cb(error, JSON.parse(req.responseText), req.status);
				} catch (e) {
					// it is not a JSON
					cb(error, req.responseText, req.status);
				}
			}
			// there is no response body...
			cb(error, res, req.status);
		}
	}

});

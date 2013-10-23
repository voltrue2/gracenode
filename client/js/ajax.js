(function () {

	var domain = window.location.origin + '/';
	var block = null;

	/*
	 *@url (String)
	 *@params (Object)
	 *@cb (Function)
	 * **/ 
	function ajax(uri, params, cb) {
		if (typeof cb !== 'function') {
			console.error('ajax: missing callback (argument 3)');
			return;
		}

		var ee = new EventEmitter();		

		var method = params && params.method || 'GET';
		var path = window.encodeURI(domain + uri);
		var paramStr = getParams(params);
		var req = null;

		if (!window.XMLHttpRequest) {
			// IE < 7
			req = new ActiveXObject('Microsoft.XMLHTTP');
		} else {
			req = new window.XMLHttpRequest();
		}

		req.overrideMimeType('text');
		req.open(method, path, true);
		req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

		req.onreadystatechange = function () {
			if (req.readyState === 4) {
				ee.emit('response', req);
				var error = null;
				var response = null;
				if (req.status >= 200 && req.status <= 299 || req.status == 304) {
					try {
						response = JSON.parse(req.responseText);
					} catch (Exception) {
						error = {
							status: req.status,
							path: path,
							response: response
						};
						console.error('ajax, JSON.parse: ', Exception.toString());
						console.trace();
						ee.emit('response.error', error);
					}
				} else {
					error = {
						status: req.status,
						path: path,
						response: response
					};
					ee.emit('response.error', error);
				}
				ee.emit('response.complete', error, response);
				cb(error, response);
			}
		};
		ee.emit('send');
		req.send(paramStr);
		return ee;
	}

	function getParams(params) {
		var str = '';
		for (var key in params) {
			if (str !== '') {
				str += '&';
			}
			str += window.encodeURIComponent(key) + '=' + prepareValue(params[key]);
		}
		return str;
	}

	function prepareValue(value) {
		if (typeof value === 'object') {
			return window.encodeURIComponent(JSON.stringify(value));
		}
		return window.encodeURIComponent(value);
	}
	
	window.setAjaxDomain = function (d) {
		domain = d;
	};
	
	window.ajax = ajax;

}());

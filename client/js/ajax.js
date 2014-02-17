(function () {

	var domain = window.location.origin + '/';
	var block = null;

	var ajaxEvents = new EventEmitter();

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

		var request = new Request(req);

		req.overrideMimeType('text');
		req.open(method, path, true);
		req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

		req.onreadystatechange = function () {
			if (req.readyState === 4) {
				request.emit('response', req);
				ajaxEvents.emit('response', req);
				var error = null;
				var response = null;
				if (req.responseText) {
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
						request.emit('response.error', error);
						ajaxEvents.emit('response.error', error);
					}
					if (req.status >= 400) {
						error = {
							status: req.status,
							path: path,
							response: response
						};
						var resendObj = {
							path: path, 
							params: params,
							callback: cb
						};
						request.emit('response.error', error, resendObj);
						ajaxEvents.emit('response.error', error, resendObj);
					}
				}
				request.emit('response.complete', error, response);
				ajaxEvents.emit('response.complete', error, response);
				cb(error, response);
			}
		};
		request.emit('send');
		ajaxEvents.emit('send');
		req.send(paramStr);
		return request;
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

	function Request(req) {
		this._req = req;
	}

	window.inherits(Request, window.EventEmitter);

	Request.prototype.abort = function () {
		this._req.abort();
	};
	
	window.setAjaxDomain = function (d) {
		domain = d;
	};

	// expose
	window.ajaxEvents = ajaxEvents;	
	window.ajax = ajax;

}());

(function () {

var validationPatterns = {
	numeric: /^\d+$/,
	alphaNumeric: /^[a-z0-9]+$/i,
	password: /^[a-z0-9\@\!\_\-\+\=\$\%\#\?]/i
};

window.util = {};

/*
* params: { pattern: 'numeric' or 'alphaNumeric', alloweSpace: true or false, allowHTML: true or false }
*
**/
window.util.validateInput = function (input, minLen, maxLen, params) {
	var allowHTML = params && params.allowHTML || false;
	var allowSpace = params && params.allowSpace || false;
	var pattern = params && params.pattern && validationPatterns[params.pattern] || null;
	var len = input.length;

	// length check
	if (len < minLen || len > maxLen) {
		return false;
	}

	// HTML check
	if (!allowHTML && input.match(/(<([^>]+)>)/ig)) {
		return false;
	}
	
	// space check
	if (!allowSpace && input.match(' ')) {
			return false;			
	}

	// pattern check
	if (pattern && !input.match(pattern)) {
		return false;
	} 

	return true;
};

/*
* get cookie
*/
window.util.getCookie = function (key) {
	var cookie = parseCookie();
	if (cookie[key] !== undefined) {
		return cookie[key];
	}
	return null;
};

window.util.getCookies = function (keyList) {
	var res = {};
	var cookie = parseCookie();
	for (var i = 0, len = keyList.length; i < len; i++) {
		var key = keyList[i];
		if (cookie[key] !== undefined) {
			res[key] = cookie[key];
		}
	}
	return res;
};

window.util.getAllCookies = function () {
	return parseCookie();
};
 
function parseCookie() {
	var cookie = document.cookie;
	var list = cookie.split(';');
	var res = {};
	for (var i = 0, len = list.length; i < len; i++) {
		var item = list[i].split('=');
		if (item[0] !== undefined && item[1] !== undefined) {
			res[item[0]] = enforceDataType(item[1]);
		}
	}
	return res;
} 

function enforceDataType(data) {
	switch (data) {
		case 'true':
			return true;
		case 'false':
			return false;
		case 'null':
			return null;
		case 'undefined':
			return undefined;
		default:
			try {
				return JSON.parse(data);
			} catch (error) {
				return data;
			}
	}
}

}());


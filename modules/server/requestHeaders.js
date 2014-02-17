
var gracenode = require('../../');
var log = gracenode.log.create('headers');

var osRegex = /(iPhone|Linux|Windows|iPod|iPad|Macintosh|Android)/i;
var browserRegex = /(IE|Chrome|Firefox|Safari|Opera)/i;


module.exports.create = function (reqHeaders) {
	return new Headers(reqHeaders);
};

function Headers(reqHeaders) {
	this._headers = reqHeaders;
	this._os = null;
	this._client = null;
	this._lang = null;
	// parse user agent
	this.parseUserAgent(this.get('user-agent'));
	// parse accept language
	this.parseLanguage(this.get('accept-language'));
}

Headers.prototype.get = function (name) {
	return this._headers[name] || null;
};

Headers.prototype.getAll = function () {
	return gracenode.lib.cloneObj(this._headers);
};

Headers.prototype.getOs = function () {
	return this._os;	
};

Headers.prototype.getClient = function () {
	return this._client;
};

Headers.prototype.getDefaultLang = function () {
	return this._lang;
};

Headers.prototype.parseUserAgent = function (userAgent) {
	if (!userAgent) {
		return false;
	}
	// detect OS
	var osRes = userAgent.match(osRegex);
	if (osRes) {
		this._os = osRes[osRes.length - 1];
	}
	log.verbose('client OS/Device:', this._os);	
	// detect browser
	var browserRes = userAgent.match(browserRegex);
	if (browserRes) {
		this._client = browserRes[browserRes.length - 1];
	}
	log.verbose('client browser:', this._client);
};

Headers.prototype.parseLanguage = function (acceptLang) {
	if (!acceptLang) {
		return false;
	}
	// detect default accept language
	var qval = 0.0;
	var lang = {};
	var x = acceptLang.split(',');
	for (var i = 0, len = x.length; i < len; i++) {
		var matches = x[i].match(/(.*);q=([0-1]{0,1}\.\d{0,4})/i);
		if (matches) {
			lang[matches[1]] = matches[2];
		} else {
			lang[x[i]] = 1.0;
		}
	}
	for (var key in lang) {
		var value = lang[key];
		if (value > qval) {
			qval = value;
			this._lang = key;
		}
	}
	// force lower case
	this._lang = this._lang.toLowerCase();
	log.verbose('client default language:', this._lang);
};

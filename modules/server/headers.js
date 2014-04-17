
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
	this._agent = this.get('user-agent');
	this._acceptLang = this.get('accept-language');
}

Headers.prototype.get = function (name) {
	return this._headers[name] || null;
};

Headers.prototype.getAll = function () {
	return gracenode.lib.cloneObj(this._headers);
};

Headers.prototype.getOs = function () {
	this.parseUserAgent();
	return this._os;	
};

Headers.prototype.getClient = function () {
	this.parseUserAgent();
	return this._client;
};

Headers.prototype.getDefaultLang = function () {
	return this.parseLanguage();
};

Headers.prototype.parseUserAgent = function () {
	if (!this._agent) {
		return false;
	}
	if (this._os || this._client) {
		return false;
	}
	// detect OS
	var osRes = this._agent.match(osRegex);
	if (osRes) {
		this._os = osRes[osRes.length - 1];
	}
	log.verbose('client OS/Device:', this._os);	
	// detect browser
	var browserRes = this._agent.match(browserRegex);
	if (browserRes) {
		this._client = browserRes[browserRes.length - 1];
	}
	log.verbose('client browser:', this._client);
};

Headers.prototype.parseLanguage = function () {
	if (!this._acceptLang) {
		return false;
	}
	// detect default accept language
	var language = '';
	var qval = 0.0;
	var lang = {};
	var x = this._acceptLang.split(',');
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
			language = key;
		}
	}
	// force lower case
	language = language.toLowerCase();
	log.verbose('client default language:', this._lang);
	return language;
};

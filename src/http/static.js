'use strict';

var gn = require('../gracenode');

module.exports.handle = function _httpStaticHandle(dir) {
	var handler = new Handler(dir);
	var func = function (req, res) {
		handler.handle.apply(handler, [req, res]);
	};
	return func;
};

function Handler(dir) {
	this._logger = gn.log.create('HTTP.static: ' + dir);
	this._dir = gn.getRootPath() + dir;
	this._tailSlash = this._dir[this._dir.length - 1];
}

Handler.prototype.handle = function __httpStaticHandlerHandle(req, res) {
	var filename = req.params.staticfile;
	const len = filename.length - 1;
	if (filename[len] === '/') {
		filename = filename.substring(0, len);
	}
	if (this._tailSlash === '/' && filename[0] === '/') {
		filename = filename.substring(1);
	} else if (this._tailSlash !== '/' && filename[0] !== '/') {
		filename = '/' + filename;
	}
	var path = this._dir + filename;
	this._logger.verbose(path);
	res.file(path);
};

'use strict';

var gn = require('gracenode');

module.exports.handle = function (dir) {
	var handler = new Handler(dir);
	var func = function (req, res) {
		handler.handle.apply(handler, [req, res]);
	};
	return func;
};

function Handler(dir) {
	this._dir = gn.getRootPath() + dir;
}

Handler.prototype.handle = function (req, res) {
	var filename = req.params.filename;
	var path = this._dir + filename;
	res.file(path);
};

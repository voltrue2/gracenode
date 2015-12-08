'use strict';

var gn = require('gracenode');

module.exports = function (req, res) {
	var msg = req.params.message || '';
	gn.mod.views.hello(res, {
		message: msg,
		today: Date.now()
	});
};

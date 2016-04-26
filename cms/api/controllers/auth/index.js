'use strict';

var gn = require('gracenode');

module.exports = function (req, res) {
	gn.mod.views.load(res, 'auth/index');
};

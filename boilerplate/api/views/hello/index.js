'use strict';

var gn = require('gracenode');

module.exports = function (res, data) {
	var rend = gn.render('hello/index.html', data);
	res.html(rend);
};

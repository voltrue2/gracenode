'use strict';

var gn = require('gracenode');
var func = require('./func');

// Register all view template custom functions
gn.render.func('showToday', func.showToday);

// Register all views
module.exports = {
	hello: require('./hello')
};

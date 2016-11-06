'use strict';

var gn = require('gracenode');
var logger;
var config;
//var enabled = false;
//var nodes = [];

module.exports.setup = function (_config) { 
	logger = gn.log.create('gic.nodes');
	config = _config;
};

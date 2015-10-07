'use strict';

var defs = {
	value: 100
};

exports.name = 'withExitTask';

exports.config = function (config) {
	defs = config;
};

exports.setup = function (cb) {
	cb();
};

exports.exit = function (cb) {
	cb();
};

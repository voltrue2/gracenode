'use strict';

var gn = require('gracenode');
var func = require('./func');

// Register all view template custom functions
for (var name in func) {
	if (typeof func[name] === 'function') {
		gn.render.func(name, func[name]);
	}
}

// Register all views
module.exports = {
	hello: require('./hello')
};

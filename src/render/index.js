'use strict';

var loader = require('./loader');
var render = require('./render');

var pathPrefix = '';

exports.config = function (path) {
	pathPrefix = path;
};

exports.setup = function (cb) {
	loader.load(pathPrefix, cb);	
};

exports.render = function (path, vars) {
	return render.render(path, vars);
};

exports.config('/var/www/npm-repo/node_modules/gracenode/src/render/templates');
exports.setup(function (error) {
	if (error) {
		return console.error(error);
	}
	var data = {
		jspath: '/path/to/my/whatever/',
		list: [ '/1111', '2222' ],
		a: 'AAA',
		b: 'BBB',
		c: '/two'
	};
	var rendered = exports.render('/one/index.html', data);
	
	console.log(rendered);
});

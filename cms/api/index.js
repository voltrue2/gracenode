'use strict';

var gn = require('gracenode');

module.exports.setup = function (cb) {

	// Static file routes
	gn.http.static('/static', [
		'asset/'
	]);

	// Sessions and hooks
	gn.session.useHTTPSession([
		'/dashboard'
	]);

	// GET routes
	gn.http.get('/', function (req, res) {
		res.redirect('/dashboard');
	});
	gn.http.get('/dashboard', require('./controllers/dashboard'));
	gn.http.get('/auth', require('./controllers/auth'));

	// Error routes
	gn.http.error(401, require('./controllers/errors/unauthorized'));

	cb();
};

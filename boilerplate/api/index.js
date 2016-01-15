'use strict';

var gn = require('gracenode');

// Static file routes
gn.router.static('/static', [
	'asset/'
]);

// GET routes
gn.router.get('/', require('./controllers/hello'));
gn.router.get('/hello/{string:message}', require('./controllers/hello'));

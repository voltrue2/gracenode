'use strict';

var gn = require('gracenode');

// Static file routes
gn.http.static('/static', [
	'asset/'
]);

// GET routes
gn.http.get('/', require('./controllers/hello'));
gn.http.get('/hello/{string:message}', require('./controllers/hello'));

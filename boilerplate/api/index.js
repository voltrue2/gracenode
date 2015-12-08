'use strict';

var gn = require('gracenode');

// GET routes
gn.router.get('/', require('./controllers/hello'));
gn.router.get('/hello/{string:message}', require('./controllers/hello'));

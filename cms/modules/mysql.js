'use strict';

var mysql = require('mysql');

// TODO: think about it
var POOL_LIMIT = 10;

var dbs = {};
var logger;
var config;

module.exports.config = function (configIn) {
	config = configIn;
};

module.exports.setup = function (cb) {
	logger = gn.log.create('mysql');
	for (var db in config) {
		dbs[db] = mysql.createPool({
			connectionLimit: POOL_LIMIT,
			host: config[db].host,
			port: config[db].port,
			database: config[db].database,
			user: config[db].user,
			password: config[db].password
		});
		logger.info('connection pool created:', db, config[db]);
	}
	cb();
};

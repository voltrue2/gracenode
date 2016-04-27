'use strict';

var gn = require('gracenode');
var async = gn.require('./node_modules/gracenode/lib/async');
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
	gn.onExit(function closeMysql(callback) {
		var list = Object.keys(dbs);
		async.forEach(list, function (db, next) {
			logger.info('closing all pooled connections to:', db);
			dbs[db].end(next);
		}, callback);
	});
	cb();
};

module.exports.getConnection = function (dbname, cb) {
	var db = dbs[dbname];
	if (!db) {
		return cb(new Error('InvalidDatabaseName'));
	}
	db.getConnection(function (error, conn) {
		if (error) {
			return cb(error);
		}
		var done = function (error) {
			if (error) {
				logger.error(error);
			}
			logger.info('connection [' + dbname + '] released to pool');
			conn.release();
		};
		cb(null, conn, done);
	});
};

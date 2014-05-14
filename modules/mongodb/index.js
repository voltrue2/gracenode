var mongodb = require('mongodb');
var async = require('async');
var gracenode = require('../../');
var logger = gracenode.log.create('mongodb');
var Db = require('./db');

var config = null;
var pools = {};

/*
"mongodb": {
	"name of your choice": {
		"host": "host name or ip address",
		"port": port number,
		"database": "database name",
		"poolSize": <optional> // default is 5
	} {...}
}
*/

module.exports.readConfig = function (configIn) {
	if (!configIn) {
		return new Error('invalid configurations given:\n' + JSON.stringify(configIn));
	}
	config = configIn;
};

module.exports.setup = function (cb) {
	var keys = Object.keys(config);
	var client = mongodb.MongoClient;
	async.eachSeries(keys, function (name, next) {
		var configData = config[name];
		var url = 'mongodb://' + configData.host + ':' + configData.port + '/' + configData.database;

		if (configData.poolSize) {
			url += '?maxPoolSize=' + configData.poolSize;
		}

		logger.verbose('creating connection pool to mongodb [' +  configData.database + ']');

		client.connect(url, function (error, db) {
			if (error) {
				return cb(error);
			}
			pools[name] = { db: db, database: configData.database };
			
			logger.info('connection pool to mongodb created [' +  configData.database + ']');
			
			next();
		});
	},
	function () {
		// register graceful exit cleaner
		gracenode.registerShutdownTask('mongodb', function (done) {
			var names = Object.keys(pools);
			async.eachSeries(names, function (name, next) {
				pools[name].db.close(function (error) {
					if (error) {
						logger.error('failed to close connection to mongodb [' + pools[name].database + ']', error);
					}
					logger.info('connection pool to mongodb closed [' + pools[name].database + ']');
					delete pools[name];
					next();
				});
			}, done);
		});
		// all is done
		cb();
	});
};

module.exports.create = function (name) {
	if (pools[name]) {
		return new Db(pools[name].database, pools[name].db);
	}
	return null;
};

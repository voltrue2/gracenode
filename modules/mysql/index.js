
// FIXME: refactor this code.... very ugly
/***
 * configurations
 *
 * {
 *		"mysql": {
 *			"config name of your choice": {
 *				"database": "database name",
 *				"host": "db host or ip address",
 *				"user": "db user",
 *				"password": "db password",
 *				"type": "user type ("ro" or "rw")" // ro stands for read only and rw stands for read and write
 *			},
 *			"config name of your choice": {
 *				"database": "database name",
 *				"host": "db host or ip address",
 *				"user": "db user",
 *				"password": "db password",
 *				"type": "user type ("ro" or "rw")" // ro stands for read only and rw stands for read and write
 *			}....
 *		}
 * }
 *
 * */

var util = require('util');
var async = require('async');
var EventEmitter = require('events').EventEmitter;
var mysql = require('mysql');

var gracenode = require('../../');
var log = gracenode.log.create('mysql');

var poolMap = {};
var configs = {};
var writeQueries = [
	'insert ',
	'update ',
	'alter ',
	'delete ',
	'drop ',
	'create ',
	'transaction',
	'rollback',
	'commit'
];

module.exports.readConfig = function (configIn) {
	for (var name in configIn) {
		if (!configIn[name].database || !configIn[name].host || !configIn[name].user || !configIn[name].password || !configIn[name].type) {
			return new Error('invalid configurations: \n' + JSON.stringify(configIn, null, 4));
		}
	}
	configs = configIn;
	return true;
};

module.exports.setup = function (cb) {
	
	log.info('establishing connection pools to mysql...');

	// graceful exit clean up
	gracenode.on('exit', function () {
		log.info('discarded all connection pools to mysql');
	});

	// create connection pools
	var nameList = Object.keys(configs);
	async.forEach(nameList, function (name, callback) {
		var conf = configs[name];

		var pool = mysql.createPool({
			waitForConnections: true,
			host: conf.host,
			database: conf.database,
			maxPoolNum: conf.maxPoolNum || 10,
			user: conf.user,
			password: conf.password,
			port: conf.port || undefined,
		});

		poolMap[name] = pool;
		
		log.info('connection pool ceated: ', name, conf);

		callback();
	}, cb);
};

/**
 * @param {String} 
 * */
module.exports.create = function (configName) {
	var config = configs[configName] || null;
	if (!config) {
		return new Error('invalid configuration configuration name given: ' + configName + ' > \n' + JSON.stringify(configs, null, 4));
	}
	
	log.verbose('create mysql with: ', configName);
	
	var pool = poolMap[configName] || null;
	if (!pool) {
		return new Error('connection not found:' + configName);
	}

	return new MySql(configName, pool, config);
};

function validateQuery(sql, type) {
	if (type === 'rw') {
		// status rw allows writes
		return true;
	}
	sql = sql.toLowerCase();
	for (var i = 0, len = writeQueries.length; i < len; i++) {
		var wq = writeQueries[i];
		var index = sql.indexOf(wq);
		if (index !== -1) {
			return false;
		}
	}
	return true;	
}

function MySql(name, pool, config) {
	EventEmitter.call(this);
	this._name = name;
	this._pool = pool;
	this._config = config;
	this._transactionConnection = null; // do not touch this outside of this module!
}

util.inherits(MySql, EventEmitter);

MySql.prototype.placeHolder = function (params) {
	var tmp = [];
	for (var i = 0, len = params.length; i < len; i++) {
		tmp.push('?');
	}
	return tmp.join(',');
};

MySql.prototype.getOne = function (sql, params, cb) {
	this.exec(sql, params, function (error, res) {
		if (error) {
			return cb(error);
		}
		if (!res) {
			return cb(new Error('no result'));
		}
		if (!res.length) {
			return cb(new Error('found nothing'));
		}
		if (res.length) {
			// we want one record only
			res = res[0];
		}
		cb(null, res);
	});
};

MySql.prototype.getMany = function (sql, params, cb) {
	this.exec(sql, params, function (error, res) {
		if (error) {
			return cb(error);
		}
		if (!res) {
			return cb(new Error('no result'));
		}
		if (!res.length) {
			return cb(new Error('found nothing'));
		}
		cb(null, res);	
	});
};

MySql.prototype.searchOne = function (sql, params, cb) {
	this.exec(sql, params, function (error, res) {
		if (error) {
			return cb(error);
		}
		if (!res || !res.length) {
			return cb(null, null);
		}
		cb(null, res[0]);
	});
};

MySql.prototype.searchMany = function (sql, params, cb) {
	this.exec(sql, params, function (error, res) {
		if (error) {
			return cb(error);
		}
		if (!res || !res.length) {
			return cb(null, []);
		}
		cb(null, res);
	});
};

// backward compatibility support
MySql.prototype.write = function (sql, params, cb) {
	this.exec(sql, params, cb);
};

MySql.prototype.exec = function (sql, params, cb) {
	
	log.verbose('attempt to execute query:', sql, params);

	var valid = validateQuery(sql, this._config.type);
	if (!valid) {
		return cb(new Error('invalid query for type ' + this._config.type));
	}
	
	var that = this;

	this.connect(function (error, connection) {
		if (error) {
			return cb(error);
		}

		connection.query(sql, params, function (error, result) {
			if (error) {
				return cb(error);
			}

			log.info('query executed:', sql, params);			

			that.release(connection);

			cb(error, result);
		});	
	});
};

MySql.prototype.connect = function (cb) {
	if (this._transactionConnection) {
		log.verbose('in transaction mode re-using connection');
		// we are in transaction mode and will be re-using connection until the transaction ends
		return cb(null, this._transactionConnection);
	}
	
	log.verbose('obtaining connection from pool [' + this._name + ']');

	var that = this;

	this._pool.getConnection(function (error, connection) {
		if (error) {
			return cb(error);
		}

		log.info('connection obtained from pool [' + that._name + ']');
		
		cb(null, connection);
	});
};

MySql.prototype.release = function (connection) {
	if (!this._transactionConnection) {
		// release the connection back to pool
		connection.release();
		log.info('released connection back to pool [' + this._name + ']');
		return;
	}
	log.verbose('connection kept for transaction');
};

MySql.prototype.transaction = function (taskCallback, cb) {
	if (this._config.type !== 'rw') {
		return cb(new Error('cannot execute transaction with type: ' + this._config.type));
	}

	log.info('transaction started');

	var that = this;
	var reuseConn = null;

	this.connect(function (error, connection) {
		if (error) {
			return cb(error);
		}
		
		var autoRollback = function (error) {
			connection.query('ROLLBACK', null, function (err) {
				if (err) {
					return log.error(err);
				}

				log.info('transaction auto-rollback on uncaught exception');

				connection.release();

				log.info('connection released to pool');

				log.info('transaction ended');

				cb(error);
			});
		};

		gracenode.once('uncaughtException', autoRollback);

		async.waterfall([
			function (callback) {
				callback(null, connection);
			},

			function (connection, callback) {
				connection.query('START TRANSACTION', null, function (error) {
					if (error) {
						return callback(error);
					}

					callback(null, connection);
				});
			},

			function (connection, callback) {
				reuseConn = connection;
				callback(null, that._name, connection);				
			},

			function (name, connection, callback) {
				var transactionMysql = module.exports.create(name);
				// this connection will be re-used in this transaction
				transactionMysql._transactionConnection = connection;	
				callback(null, transactionMysql);
			},

			function (mysql, callback) {
				taskCallback(mysql, callback);
			}

		], 
		function (error) {
			if (error) {
				reuseConn.query('ROLLBACK', null, function (err) {
					if (err) {
						log.error(err);
					}

					log.info('transaction rollback');

					reuseConn.release();

					log.info('connection released to pool');

					log.info('transaction ended');

					gracenode.removeListener('unchaughtException', autoRollback);

					cb(error);
				});
				return;
			}

			reuseConn.query('COMMIT', null, function (err) {
				if (err) {
					log.error(err);
				}

				log.info('transaction commit');

				reuseConn.release();

				log.info('connection released to pool');

				log.info('transaction ended');

				gracenode.removeListener('unchaughtException', autoRollback);

				cb();
			});
		});	

	});
};

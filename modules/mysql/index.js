
// FIXME: refactor this code.... very ugly
/***
 * configurations
 *
 * {
 *		"mysql": {
 *			"config name of your choice": {
 *				"read": {
 *					"database": "database name",
 *					"host": "db host or ip address",
 *					"user": "db user",
 *					"password": "db password"
 *				},
 *				"write": {
 *					"database": "database name",
 *					"host": "db host or ip address",
 *					"user": "db user",
 *					"password": "db password"
 *				}
 *			} {...}
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
		for (var type in configIn[name]) {
			var conf = configIn[name][type];
			if (!conf.database || !conf.host || !conf.user || !conf.password) {
				return new Error('invalid configurations for [' + name + '.' + type + ']: \n' + JSON.stringify(configIn, null, 4));
			}
		}
	}
	configs = configIn;
	return true;
};

module.exports.setup = function (cb) {
	
	log.info('establishing connection pools to mysql...');

	// graceful exit clean up
	gracenode.registerShutdownTask('mysql', function (callback) {
		var idList = Object.keys(poolMap);
		async.eachSeries(idList, function (id, next) {
			var pool = poolMap[id];
			log.info('discarding connection pool for', id);
			pool.end(next);
		},
		function () {
			log.info('discarded all connection pools to mysql');
			callback();
		});
	});

	// create connection pools
	for (var confName in configs) {
		var confGroup = configs[confName];
		for (var type in confGroup) {
			var conf = confGroup[type];
			var name = createName(confName, conf, type);
			var params = {
				waitForConnections: true,
				host: conf.host,
				database: conf.database,
				maxPoolNum: conf.maxPoolNum || 10,
				user: conf.user,
				password: conf.password,
				port: conf.port || undefined,
			};
			var pool = mysql.createPool(params); 
			poolMap[name] = pool;
			
			log.info('connection pool created: ', name, params);
		}
	}

	cb();
};

module.exports.create = function (confName) {
	if (!configs[confName]) {
		log.fatal('invalid configuration name given:', confName);
		return null;
	}
	var config = configs[confName];
	var read = module.exports.createOne(confName, config.read, 'read');
	if (read instanceof Error) {
		log.fatal(read);
		log.fatal('failed to establish "read" mysql instance...');
		return null;
	}
	var write = module.exports.createOne(confName, config.write, 'write');
	if (write instanceof Error) {
		log.fatal(write);
		log.fatal('failed to establish "write" mysql instance...');
		return null;
	}
	return new MySqlGroup(read, write);
};

/**
* Do NOT use this method outside!! 
* */
module.exports.createOne = function (confName, config, type) {
	if (!config) {
		return new Error('invalid configuration configuration name given: > \n' + JSON.stringify(configs, null, 4));
	}
	
	var name = createName(confName, config, type);
	var pool = poolMap[name] || null;
	if (!pool) {
		return new Error('connection not found: ' + name);
	}

	log.info('connection pool found:', name);

	return new MySql(name, pool, config, type);
};

function MySqlGroup(read, write) {
	this._read = read;
	this._write = write;
}

util.inherits(MySqlGroup, EventEmitter);

MySqlGroup.prototype.placeHolder = function (params) {
	return this._read.placeHolder(params);
};

MySqlGroup.prototype.getOne = function (sql, params, cb) {
	this._read.getOne(sql, params, cb);
};

MySqlGroup.prototype.getMany = function (sql, params, cb) {
	this._read.getMany(sql, params, cb);
};

MySqlGroup.prototype.searchOne = function (sql, params, cb) {
	this._read.searchOne(sql, params, cb);
};

MySqlGroup.prototype.searchMany = function (sql, params, cb) {
	this._read.searchMany(sql, params, cb);
};

MySqlGroup.prototype.write = function (sql, params, cb) {
	this._write.write(sql, params, cb);
};

MySqlGroup.prototype.transaction = function (taskCallback, cb) {
	this._write.transaction(taskCallback, cb);
};

function MySql(name, pool, config, type) {
	EventEmitter.call(this);
	this._name = name;
	this._pool = pool;
	this._config = config;
	this._type = type;
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

	var valid = validateQuery(sql, this._type);
	if (!valid) {
		return cb(new Error('invalid query for type ' + this._type));
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
	if (this._type !== 'write') {
		return cb(new Error('cannot execute transaction with type: ' + this._type));
	}

	var that = this;
	var reuseConn = null;

	this.connect(function (error, connection) {
		if (error) {
			return cb(error);
		}

		log.info('transaction started');
		
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
				// this connection will be re-used in this transaction
				var transactionMysql = new MySql(name, that._pool, that._config, that._type);
				transactionMysql._transactionConnection = connection;	
				callback(null, transactionMysql);
			},

			function (transactionMysql, callback) {
				taskCallback(transactionMysql, callback);
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

				that._transactionConnection = null;

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

function validateQuery(sql, type) {
	if (type === 'write') {
		// status write allows writes
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

function createName(confName, conf, type) {
	return confName + '-' + conf.database + '-' + conf.host + '-' + type;
}


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
var EventEmitter = require('events').EventEmitter;
var mysql = require('mysql');

var gracenode = require('../../');
var log = gracenode.log.create('mysql');

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

/**
 * @param {String} 
 * */
module.exports.create = function (configName) {
	var config = configs[configName] || null;
	if (!config) {
		return new Error('invalid configuration configuration name given: ' + configName + ' > \n' + JSON.stringify(configs, null, 4));
	}
	
	log.info('create a new mysql connection pool (' + configName + ')');
	
	var connection = mysql.createPool({
		host: config.host,
		database: config.database,
		user: config.user,
		password: config.password,
		port: config.port || undefined,
	});
	
	log.verbose('create mysql with: ', configName, config);
	
	return new MySql(configName, connection, config);
};

// listen to gracenode exit
gracenode.on('exit', function () {
});

function MySql(name, connection, config) {
	EventEmitter.call(this);
	this._name = name;
	this._type = config.type;
	this._resource = connection;
	this._connection = null;

	var that = this;
	
	// error on connection...
	connection.on('error', function (error) {
		that.close();
	});

	gracenode.on('uncaughtException', function () {
		that.close();
	});

	gracenode.on('exit', function () {
		that.close();
	});

}

util.inherits(MySql, EventEmitter);

MySql.prototype.close = function () {
	if (this._resource) {
		var that = this;
		this._resource.end(function () {
			log.info('mysql connection closed (' + that._name + ')');
		});
		this._resource = null;
	}
};

MySql.prototype.getOne = function (sql, params, cb) {
	this.get(sql, params, true, function (error, res) {
		if (res && res.length) {
			// we want one record only
			res = res[0];
		}
		cb(error, res);
	});
};

MySql.prototype.getMany = function (sql, params, cb) {
	this.get(sql, params, true, cb);
};

MySql.prototype.searchOne = function (sql, params, cb) {
	this.get(sql, params, false, function (error, res) {
		if (res.length) {
			// we want one record only
			res = res[0];
		}
		cb(error, res);
	});
};

MySql.prototype.searchMany = function (sql, params, cb) {
	this.get(sql, params, false, cb);
};

MySql.prototype.transaction = function (taskCallback, cb) {
	
	if (this._type !== 'rw') {
		return cb(new Error('cannot execute transaction with type: ' + this._type));
	}

	var that = this;
	var errorLog = function (err) {
		if (!err) {
			return;
		}
		
		log.error(err);
	}; 
	this.startTransaction(function (error) {
		if (error) {
			that.rollBack(function (err) {
				errorLog(err);
				cb(error);
			});
		}
		try {

			taskCallback(function (error) {

				if (error) {
					return that.rollBack(function (err) {
						errorLog(err);
						cb(error);
					});
				}

				that.commit(function (err) {
					errorLog(err);
					cb(err);
				});
			});

		} catch (exception) {
			that.rollBack(function (err) {
				errorLog(err);
				cb(exception);
			});
		}
	});
};

MySql.prototype.write = function (sql, params, cb) {
	this.exec(sql, params, cb);
};

MySql.prototype.placeHolder = function (params) {
	return params.join(',');
};

// ---- the methods below are not meant to be called from outside (private methods)

MySql.prototype.startTransaction = function (cb) {
	var that = this;
	this.connect(function (error) {	
		if (error) {
			return cb(error);
		}
		
		log.info('start transaction');
		
		that.exec('START TRANSACTION', null, cb);
	});
};

MySql.prototype.commit = function (cb) {
	
	log.info('commit');

	var that = this;
	this.exec('COMMIT', null, function (error) {
		if (error) {
			return cb(error);
		}
		that.end(cb);
	});
};

MySql.prototype.rollBack = function (cb) {
	
	log.info('rollback');		

	var that = this;
	this.exec('ROLLBACK', null, function (error) {
		if (error) {
			return cb(error);
		}
		that.end(cb);
	});
};

MySql.prototype.get = function (sql, params, mustExist, cb) {
	if (this._type === 'ro') {
		return this.roGet(sql, params, mustExist, cb);
	}
	this.rwGet(sql, params, mustExist, cb);
};

MySql.prototype.roGet = function (sql, params, mustExist, cb) {
	var sDate = new Date();
	var start = sDate.getTime();
	
	if (!validateQuery(sql, this._type)) {
		var err = new Error('cannot execute the query (read only): ' + sql);
		return cb(err, []);
	}
	
	var that = this;
	this.connect(function (error) {
		if (error) {
	
			log.error(error);

			return cb(error, []);
		}
		that._connection.query(sql, params, function (error, res) {
			if (!error && !res.length && mustExist) {
				// we consider not finding any record an error
				error = new Error(sql + ' ' + JSON.stringify(params) + ' found nothing');
			}
			
			log.verbose(sql, params);
			if (error) {
				log.error(error);
			}

			that.end(function () {
				var eDate = new Date();
				var end = eDate.getTime();
				log.verbose(sql, ' took [' + (end - start) + ' ms]');
				cb(error, res);
			});
		});
	});
};

MySql.prototype.rwGet = function (sql, params, mustExist, cb) {
	var sDate = new Date();
	var start = sDate.getTime();
	
	var that = this;	

	if (!validateQuery(sql, this._type)) {
		var err = new Error('cannot execute the query (read only): ' + sql);
		return cb(err, []);
	}

	if (!this._connection) {
		return cb(new Error('cannot execute the query outside of transaction: ' + sql), []);
	}

	this._connection.query(sql, params, function (error, res) {
		if (!error && !res.length && mustExist) {
			// we consider not finding any record an error
			error = new Error(sql + ' ' + JSON.stringify(params) + ' found nothing');
		}

		log.verbose(sql, params);
		if (error) {
			log.error(error);
		}
		
		var eDate = new Date();
		var end = eDate.getTime();
		log.verbose(sql, ' took [' + (end - start) + ' ms]');
		
		cb(error, res);
	});
};

MySql.prototype.exec = function (sql, params, cb) {
	var sDate = new Date();
	var start = sDate.getTime();
	
	if (!validateQuery(sql, this._type)) {
		var err = new Error('cannot execute the query (read only): ' + sql);
		return cb(err, {});
	}

	if (!this._connection) {
		// execute the query outside of transaction
		log.info('executing write query without of transaction');
		var that = this;
		return this.connect(function (error) {
			if (error) {
				return that.end(function () {
					cb(error);
				});
			}
			that._connection.query(sql, params, function (error, res) {
				if (error) {
					log.error(error);
				}
				var eDate = new Date();
				var end = eDate.getTime();
				log.info(sql, params, ' took [' + (end - start) + ' ms]');

				log.info('query result:', res);
				
				that.end(function () {
					cb(error, res);
				});
			});
		});
	}

	// execute the query in transaction
	this._connection.query(sql, params, function (error, res) {
		if (error) {
			log.error(error);
		}
		var eDate = new Date();
		var end = eDate.getTime();
		log.info(sql, params, ' took [' + (end - start) + ' ms]');

		log.info('query result:', res);
		
		cb(error, res);
	});
	
};

MySql.prototype.connect = function (cb) {
	var that = this;
	var callback = function (error, pooledConnection) {
		if (error) {

			log.error(error);

			return cb(error);
		}
		
		log.info('connect to mysql (' + that._name + ') [connection pooled]');
	
		that._connection = pooledConnection;
		cb(null);
	};

	log.info('obtaining connection to mysql (' + this._name + ')...');

	this._resource.getConnection(callback);
};

MySql.prototype.end = function (cb) {
	
	log.info('release connection to mysql (' + this._name + ')');
	
	this._connection.release();
	return cb(null);
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

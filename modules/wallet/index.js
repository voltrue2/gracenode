
var gracenode = require('../../');
var log = gracenode.log.create('wallet');

var config = null;
var reader = null;
var writer = null;
var wallets = {};

module.exports.readConfig = function (configIn) {
	if (!gracenode.mysql) {
		throw new Error('wallet module requires mysql module');
	}
	if (!configIn || !configIn.names || !Array.isArray(configIn.names) || !configIn.sql || !configIn.sql.read || !configIn.sql.write) {
		throw new Error('invalid configurations given:\n', JSON.stringify(configIn));
	}
	config = configIn;
};

module.exports.setup = function (cb) {
	for (var i = 0, len = config.names.length; i < len; i++) {
		var name = config.names[i];
		wallets[name] = new Wallet(name);
		log.verbose('wallet [' + name + '] created');
	}
	reader = gracenode.mysql.create(config.sql.read);
	writer = gracenode.mysql.create(config.sql.write);
	cb();
};

module.exports.create = function (walletName) {
	if (wallets[walletName]) {
		return wallets[walletName];
	}
	log.error('wallet [' + walletName + '] not found');
	return null;
};

function Wallet(name) {
	this._name = name;
}

Wallet.prototype.getBalanceByUserId = function (userId, cb) {
	getBalanceByUserId(this, reader, userId, cb);
};

Wallet.prototype.addPaid = function (receiptHashId, userId, price, value, onCallback, cb) {
	this.add(receiptHashId, userId, price, value, 'paid', onCallback, cb);
};

Wallet.prototype.addFree = function (receiptHashId, userId, price, value, onCallback, cb) {
	this.add(receiptHashId, userId, price, value, 'free', onCallback, cb);
};

Wallet.prototype.spend = function (userId, valueToSpend, spendFor, onCallback, cb) {

	if (typeof valueToSpend !== 'number' || valueToSpend <= 0) {
		return cb(new Error('invalid value to spend given:' + valueToSpend + ':' + (typeof valueToSpend)));
	}
	
	var that = this;

	writer.transaction(function (callback) {
		
		getBalanceByUserId(that, writer, userId, function (error, balance) {
			if (error) {
				return callback(error);
			}

			log.info('trying to spend ' + valueToSpend + ' out of ' + balance + ' user: ' + userId);
			
			// check if the user has enough value to spend
			if (balance < valueToSpend) {
				return callback('not enough balance: user(' + userId + ')');
			}

			var newBalance = balance - valueToSpend;

			updateBalance(userId, that._name, newBalance, function (error) {
				if (error) {
					return callback(error);
				}
				
				updateBalanceHistoryOut(userId, that._name, valueToSpend, spendFor, function (error) {
					if (error) {
						return callback(error);
					}
					
					if (typeof onCallback === 'function') {
						return onCallback(function (error) {
							if (error) {
								log.error(error);
								return callback(error);
							}
							
							log.info('spent: ' + valueToSpend + ' out of ' + balance + ' user: ' + userId);
							
							callback(null);
						});
					}

					log.info('spent: ' + valueToSpend + ' out of ' + balance + ' user: ' + userId);

					callback();

				});
		
			});

		});

	}, 
	function (error) {
		if (error) {
			return cb(error);
		}
		cb();
	});

};

// used privately ONLY
Wallet.prototype.add = function (receiptHashId, userId, price, value, valueType, onCallback, cb) {
	
	if (typeof value !== 'number' || value <= 0) {
		return cb(new Error('invalid value to add given:' + value + ':' + (typeof value)));
	}
	
	var name = this._name;

	writer.transaction(function (callback) {

		addBalance(userId, name, value, function (error) {
			if (error) {
				return callback(error);
			}
		
			updateBalanceHistoryIn(receiptHashId, userId, name, price, value, valueType, function (error) {
				if (error) {
					return callback(error);
				}
				
				if (typeof onCallback === 'function') {
					return onCallback(function (error) {
						if (error) {
							log.error(error);
							return callback(error);
						}
						
						log.info('balance added as [' + valueType + '] added amount to [' + name + ']:', value, '(user: ' + userId + ')');					
	
						callback(null, res);
					});
				}
						
				log.info('balance added as [' + valueType + '] added amount to [' + name + ']:', value, '(user: ' + userId + ')');					
				
				callback();

			});

		});		

	},
	function (error, res) {
		if (error) {
			return cb(error);
		}
		cb();
	});

};

function getBalanceByUserId(that, db, userId, cb) {
	/*
	var sql = 'SELECT value FROM wallet_balance WHERE userId = ? AND name = ?';
	var params = [userId, that._name];
	db.searchOne(sql, params, function (error, res) {
		if (error) {
			return cb(error);
		}
		var balance = 0;
		if (res && res.value) {
			balance = res.value;
		}
		cb(null, balance);
	});
	*/
	var inSql = 'SELECT SUM(value) AS balance FROM wallet_in WHERE userId = ? AND name = ?';
	db.searchOne(inSql, [userId, that._name], function (error, walletIn) {
		if (error) {
			return cb(error);
		}
		
		var balanceIn = 0;
		if (walletIn && walletIn.balance) {
			balanceIn = walletIn.balance;
		}

		var outSql = 'SELECT SUM(value) AS balance FROM wallet_out WHERE userId = ? AND name = ?';
		db.searchOne(outSql, [userId, that._name], function (error, walletOut) {
			if (error) {
				return cb(error);
			}

			var balanceOut = 0;
			if (walletOut && walletOut.balance) {
				balanceOut = walletOut.balance;
			}

			// calculate the current balance
			var balance = balanceIn - balanceOut;
			if (balance < 0) {
				log.error('user\'s balance must not be lower than 0: (user: ' + userId + ') > ' + balance);
			}		

			cb(null, balance);

		});

	});
}

function updateBalance(userId, name, balance, cb) {
	if (balance < 0) {
		return cb(new Error('updateBalance >> balance cannot be lower than 0: user('  + userId + ') > ' + balance));
	}
	var sql = 'INSERT INTO wallet_balance (userId, name, value, created, modtime) VALUES(?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE value = ?, modtime = ?';
	var now = Date.now();
	var params = [
		// insert with
		userId,
		name,
		balance,
		now,
		now,
		// update with
		balance,
		now
	];
	writer.write(sql, params, function (error, res) {
		if (error) {
			return cb(error);
		}
	
		if (!res || !res.affectedRows) {
			return cb(new Error('updateBalance failed'));
		}
		
		cb();
	});
}

function addBalance(userId, name, balance, cb) {
	var sql = 'INSERT INTO wallet_balance (userId, name, value, created, modtime) VALUES(?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE value = value + ?, modtime = ?';
	var now = Date.now();
	var params = [
		// insert with
		userId,
		name,
		balance,
		now,
		now,
		// update with
		balance,
		now
	];
	writer.write(sql, params, function (error, res) {
		if (error) {
			return cb(error);
		}
		
		if (!res || !res.affectedRows) {
			return cb(new Error('addBalance failed'));
		}
		
		cb();
	});
}
function updateBalanceHistoryIn(receiptHashId, userId, name, price, value, valueType, cb) {
	var sql = 'INSERT INTO wallet_in (receiptHashId, userId, name, price, value, valueType, created) VALUES(?, ?, ?, ?, ?, ?, ?)';
	var params = [
		receiptHashId,
		userId,
		name,
		price,
		value,
		valueType,
		Date.now()
	];
	writer.write(sql, params, function (error, res) {
		if (error) {
			return cb(error);
		}
		
		if (!res || !res.affectedRows) {
			return cb(new Error('updateBalanceHistoryIn failed'));
		}
		
		cb();
	});
}

function updateBalanceHistoryOut(userId, name, valueToSpend, spendFor, cb) {
	var sql = 'INSERT INTO wallet_out (userId, name, value, spentFor, created) VALUES(?, ?, ?, ?, ?)';
	var params = [
		userId,
		name,
		valueToSpend,
		spendFor,
		Date.now()
	];
	writer.write(sql, params, function (error, res) {
		if (error) {
			return cb(error);
		}
		
		if (!res || !res.affectedRows) {
			return cb(new Error('updateBalanceHistoryOut failed'));
		}

		cb();
	});
}

var async = require('async');
var gracenode = require('../../');
var log = gracenode.log.create('wallet');

var config = null;
var mysqlDb = null;
var wallets = {};

module.exports.readConfig = function (configIn) {
	if (!gracenode.mysql) {
		throw new Error('wallet module requires mysql module');
	}
	if (!configIn || !configIn.names || !Array.isArray(configIn.names) || !configIn.sql) {
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
	mysqlDb = gracenode.mysql.create(config.sql);
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
	getBalanceByUserId(this, mysqlDb, userId, cb);
};

Wallet.prototype.addPaid = function (receiptHashId, userId, price, value, onCallback, cb) {
	this.add(receiptHashId, userId, price, { paid: value, free: 0 }, onCallback, cb);
};

Wallet.prototype.addFree = function (receiptHashId, userId, value, onCallback, cb) {
	this._add(receiptHashId, userId, 0, { paid: 0, free: value }, onCallback, cb);
};

Wallet.prototype.spend = function (userId, valueToSpend, spendFor, onCallback, cb) {

	if (typeof valueToSpend !== 'number' || valueToSpend <= 0) {
		return cb(new Error('invalid value to spend given:' + valueToSpend + ':' + (typeof valueToSpend)));
	}
	
	var that = this;
	
	mysqlDb.transaction(function (mysql, callback) {
		
		getBalanceByUserId(that, mysql, userId, function (error, balance) {
			if (error) {
				return callback(error);
			}

			var total = balance.paid + balance.free;

			log.info('trying to spend ' + valueToSpend + ' out of ' + total + ' user: ' + userId);
	
			// check if the user has enough value to spend
			if (total < valueToSpend) {
				return callback(new Error('not enough balance: user(' + userId + ')'));
			}

			var spendValues = calcSpendValues(valueToSpend, balance.paid, balance.free);

			spendFromBalance(mysql, userId, that._name, spendValues.paidBalance, spendValues.freeBalance, function (error) {
				if (error) {
					return callback(error);
				}

				updateBalanceHistoryOut(mysql, userId, that._name, spendValues.toSpendPaid, spendValues.toSpendFree, spendFor, function (error) {
					if (error) {
						return callback(error);
					}

					if (typeof onCallback === 'function') {
						return onCallback(function (error) {
							if (error) {
								log.error(error);
								return callback(error);
							}
							
							log.info('spent: ' + valueToSpend + ' out of ' + total + ' user: ' + userId);
							log.info('spent detail: (paid:' + spendValues.toSpendPaid + ') (free:' + spendValues.toSpendFree + ')');						
	
							callback(null);
						});
					}

					log.info('spent: ' + valueToSpend + ' out of ' + total + ' user: ' + userId);
					log.info('spent detail: (paid:' + spendValues.toSpendPaid + ') (free:' + spendValues.toSpendFree + ')');						

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

Wallet.prototype.add = function (receiptHashId, userId, price, pays, onCallback, cb) {
	var paid = pays.paid;
	var free = pays.free;
	var value = paid + free;
	
	if (typeof value !== 'number' || value <= 0) {
		return cb(new Error('invalid value to add given:' + value + ':' + (typeof value)));
	}
	
	var name = this._name;

	mysqlDb.transaction(function (mysql, callback) {

		addToBalance(mysql, userId, name, paid, free, function (error) {
			if (error) {
				return callback(error);
			}

			var updatePaidHistory = function (next) {
				if (!paid) {
					return next();
				}
				updateBalanceHistoryIn(mysql, receiptHashId, userId, name, price, paid, 'paid', function (error) {
					if (error) {
						return next(error);
					}
					log.info('balance added as [paid] added amount to [' + name + ']:', paid, '(user: ' + userId + ')');					
					next();	
				});
			};
			
			var updateFreeHistory = function (next) {
				if (!free) {
					return next();
				}
				updateBalanceHistoryIn(mysql, receiptHashId, userId, name, price, free, 'free', function (error) {
					if (error) {
						return next(error);
					}
					log.info('balance added as [free] added amount to [' + name + ']:', free, '(user: ' + userId + ')');					
					next();	
				});
			};

			var done = function (error) {
				if (error) {
					return callback(error);
				}
				
				if (typeof onCallback === 'function') {
					return onCallback(function (error) {
						if (error) {
							return callback(error);
						}
						callback();
					});
				}
				callback();
			};

			async.series([
				updatePaidHistory,
				updateFreeHistory
			], done);
		});		

	},
	function (error) {
		if (error) {
			return cb(error);
		}
		cb();
	});

};

function getBalanceByUserId(that, db, userId, cb) {
	var sql = 'SELECT paid, free FROM wallet_balance WHERE userId = ? AND name = ?';
	var params = [userId, that._name];
	db.searchOne(sql, params, function (error, res) {
		if (error) {
			return cb(error);
		}
		var balance = { paid: 0, free: 0};
		if (res) {
			if (res.paid) {
				balance.paid = res.paid;
			}
			if (res.free) {
				balance.free = res.free;
			}
		}
		cb(null, balance);
	});
}

function spendFromBalance(db, userId, name, paid, free, cb) {
	if (paid + free < 0) {
		return cb(new Error('spendFromBalance >> balance cannot be lower than 0: user('  + userId + ') > ' + 'paid: ' + paid + ', free: ' + free));
	}
	var now = Date.now();
	/*
	var sql = 'INSERT INTO wallet_balance (userId, name, paid, free, created, modtime) VALUES(?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE paid = ?, free = ?, modtime = ?';
	var params = [
		// insert with
		userId,
		name,
		paid,
		free,
		now,
		now,
		// update with
		paid,
		free,
		now
	];
	*/
	var sql = 'UPDATE wallet_balance SET paid = ?, free = ?, modtime = ? WHERE userId = ?';
	var params = [
		paid,
		free,
		now,
		userId
	];
	db.write(sql, params, function (error, res) {
		if (error) {
			return cb(error);
		}
	
		if (!res || !res.affectedRows) {
			return cb(new Error('updateBalance failed'));
		}
		
		cb();
	});
}

function addToBalance(db, userId, name, paid, free, cb) {
	var sql = 'INSERT INTO wallet_balance (userId, name, paid, free, created, modtime) VALUES(?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE paid = paid + ?, free = free + ?, modtime = ?';
	var now = Date.now();
	var params = [
		// insert with
		userId,
		name,
		paid,
		free,
		now,
		now,
		// update with
		paid,
		free,
		now
	];
	db.write(sql, params, function (error, res) {
		if (error) {
			return cb(error);
		}
		
		if (!res || !res.affectedRows) {
			return cb(new Error('addToBalance failed'));
		}
		
		cb();
	});
}
function updateBalanceHistoryIn(db, receiptHashId, userId, name, price, value, valueType, cb) {
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
	db.write(sql, params, function (error, res) {
		if (error) {
			return cb(error);
		}
		
		if (!res || !res.affectedRows) {
			return cb(new Error('updateBalanceHistoryIn failed'));
		}
		
		cb();
	});
}

function updateBalanceHistoryOut(db, userId, name, paid, free, spendFor, cb) {
	var sql = 'INSERT INTO wallet_out (userId, name, paid, free, spentFor, created) VALUES(?, ?, ?, ?, ?, ?)';
	var params = [
		userId,
		name,
		paid,
		free,
		spendFor,
		Date.now()
	];
	db.write(sql, params, function (error, res) {
		if (error) {
			return cb(error);
		}
		
		if (!res || !res.affectedRows) {
			return cb(new Error('updateBalanceHistoryOut failed'));
		}

		cb();
	});
}

function calcSpendValues(toSpend, paidBalance, freeBalance) {
	// spend from free balance first
	freeBalance = freeBalance - toSpend;
	var toSpendFree = toSpend;
	var toSpendPaid = 0;
	if (freeBalance < 0) {
		// free balance alone is not enough > spend from paid balance as well
		paidBalance += freeBalance;
		toSpendFree += freeBalance;
		toSpendPaid = toSpend - toSpendFree;
		freeBalance = 0;
	}
	return {
		paidBalance: paidBalance,
		freeBalance: freeBalance,
		toSpendPaid: toSpendPaid,
		toSpendFree: toSpendFree
	};
}

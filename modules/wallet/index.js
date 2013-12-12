
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
	var that = this;
	var balanceSql = 'SELECT SUM(value) AS amount FROM wallet_balance WHERE userId = ? AND name = ?';
	reader.searchOne(balanceSql, [userId, this._name], function (error, balance) {
		if (error) {
			return cb(error);
		}

		var balanceAmount = balance.amount || 0;
		
		log.verbose('balance amount w/o spent amount: ' + balanceAmount + ' (user: ' + userId + ')');
		
		var spentSql = 'SELECT SUM(value) AS amount FROM wallet_spent WHERE userId = ? AND name = ?';
		reader.searchOne(spentSql, [userId, that._name], function (error, spent) {
			if (error) {
				return cb(error);
			}
			
			var spentAmount = spent.amount || 0;

			log.verbose('spent amount: ' + spentAmount + ' (user: ' + userId + ')');
	
			var currentBalance = balanceAmount - spentAmount;

			if (currentBalance < 0) {
				log.error('current balance should never be smaller than 0 (userId: ' + userId + ')');
			}	
	
			cb(null, currentBalance);

		});
	});
};

Wallet.prototype.addPaid = function (receiptHashId, userId, price, value, cb) {
	this.add(receiptHashId, userId, price, value, 'paid', cb);
};

Wallet.prototype.addFree = function (receiptHashId, userId, price, value, cb) {
	this.add(receiptHashId, userId, price, value, 'free', cb);
};

Wallet.prototype.spend = function (userId, valueToSpend, spendFor, cb) {
	
	var that = this;
	
	writer.transaction(function (callback) {

		that.getBalanceByUserId(userId, function (error, balance) {
			if (error) {
				return callback(error);
			}

			log.info('tring to spend ' + valueToSpend + ' out of ' + balance + ' user: ' + userId);
			
			// check if the user has enough value to spend
			if (balance < valueToSpend) {
				return callback(new Error('not enough balance'));
			}

			var sql = 'INSERT INTO wallet_spent (userId, name, value, spentFor, created) VALUES(?, ?, ?, ?, ?)';
			var params = [
				userId,
				that._name,
				valueToSpend,
				spendFor,
				Date.now()
			];
			writer.write(sql, params, function (error, res) {
				if (error) {
					return callback(error);
				}
		
				if (!res || res.affectedRows !== 1) {
					return callback('spend failed');
				}

				log.info('spent: ' + valueToSpend + ' out of ' + balance + ' user: ' + userId);

				callback(null, res);

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

// used in privately ONLY
Wallet.prototype.add = function (receiptHashId, userId, price, value, valueType, cb) {
	
	var name = this._name;

	writer.transaction(function (callback) {
		var sql = 'INSERT INTO wallet_balance (receiptHashId, userId, name, price, value, valueType, created) VALUES(?, ?, ?, ?, ?, ?, ?)';
		var params = [
			receiptHashId,
			userId,
			name,
			price,
			value,
			'paid',
			Date.now()
		];
		writer.write(sql, params, function (error, res) {
			if (error) {
				return callback(error);
			}
			
			if (!res || res.affectedRows !== 1) {
				return callback('add failed');
			}

			log.info('added to wallet:', value + ' ' + valueType + 'receiptHashId ' + receiptHashId + ' user ' + userId);

			callback(null, res);

		});
	},
	function (error, res) {
		if (error) {
			return cb(error);
		}
		cb();
	});

};

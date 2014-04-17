var gracenode = require('GraceNode');
var logger = gracenode.log.create('mongodb-collection');

var updateOptions = {
	safe: true,
	multi: true,
	upsert: false
};

module.exports = Collection;

function Collection(dbName, name, collection) {
	this._collection = collection;
	this._name = '[' +  dbName + '.' + name + ']';
}

/*
query: <object>
fields: <array>
*/
Collection.prototype.findOne = function (query, fields, cb) {
	
	logger.verbose('execte a find query:', query, fields);

	this._collection.find(query, fields, function (error, cursor) {
		if (error) {
			return cb(error);
		}
		cursor.nextObject(function (error, doc) {
			if (error) {
				return cb(error);
			}
			logger.verbose('query exected:', query, fields);
			cb(null, doc);
		});
	});
};

/*
query: <object>
fields: <array>
pagenate: <object>
// pagenate is optional
pagenate: {
	limit: <int>
	offset: <int>
	sort: <object>,
}
*/
Collection.prototype.findMany = function (query, fields, pagenate, cb) {
	
	logger.verbose('execte a find query:', this._name, query, fields, pagenate);

	var that = this;

	this._collection.find(query, fields, function (error, cursor) {
		if (error) {
			return cb(error);
		}
		if (pagenate && pagenate.limit !== undefined && pagenate.offset !== undefined) {
			if (pagenate.sort) {
				cursor = cursor.sort(pagenate.sort).limit(pagenate.limit).skip(pagenate.offset);
			} else {
				cursor = cursor.limit(pagenate.limit).skip(pagenate.offset);
			}
			logger.verbose('query executed:', that._name, query, fields, pagenate);
			return extractResults(cursor, cb);
		}
		// no pagenation
		extractResults(cursor, cb);
	});
};

/*
find records upto limit and iterate the same operation until there is no more record
- eachCallback will be call on each iteration. eachCallback will reveive found records and next callback as arguments
- cb will be called when the iteration completes
- sort is optional
*/ 
Collection.prototype.findEach = function (query, fields, limit, sort, eachCallback, cb) {
	var pagenate = {
		offset: 0,
		limit: limit
	};
	if (sort) {
		pagenate.sort = sort;
	}

	var that = this;

	var iterator = function (pagenate, finalCallback) {
		that.findMany(query, fields, pagenate, function (error, results) {
			if (error) {
				// we will call the final callback on error
				logger.error(error);
				return finalCallback(error);
			}
			
			var next;
			// check the found records
			if (results.length < limit) {
				// this is the last iteration
				next = finalCallback;				
			} else {
				// there is more
				pagenate.offset += limit;
				next = function () {
					iterator(pagenate, finalCallback);
				};
			}

			eachCallback(results, next);
		});
	};

	iterator(pagenate, cb);
};

/*
vlaues: { object to be stored }

to insert more than one document
values: [ {object to be sotred}, {object to be stored}, {...} ]

*/
Collection.prototype.insert = function (values, cb) {
	
	logger.verbose('inserting to mongodb:', this._name, values);
	
	var that = this;

	this._collection.insert(values, function (error, res) {
		if (error) {
			return cb(error);
		}
		logger.info('inserted to mongodb:', that._name, values);
		cb(null, res);
	});
};

Collection.prototype.update = function (conditions, update, cb) {
	
	logger.verbose('updating document(s) in mongodb:', this._name, conditions, update);

	var that = this;

	this._collection.update(conditions, update, updateOptions, function (error, res) {
		if (error) {
			return cb(error);
		}
		logger.info('updated document(s) in mongodb:', that._name, conditions, update);
		cb(null, res);
	});
};

// multi: <boolean> false by default
Collection.prototype.upsert = function (conditions, update, multi, cb) {
	logger.verbose('upserting document(s) in mongodb:', this._name, conditions, update);
	var that = this;
	var options = {
		safe: true,
		multi: multi || false,
		upsert: true
	};
	this._collection.update(conditions, update, options, function (error, res) {
		if (error) {
			return cb(error);
		}
		logger.info('upserted document(s) in mongodb:', that._name, conditions, update, options);
		cb(null, res);
	});
};

// incValue must NOT be zero or negative
// threshhold is the maximum value allowed and it must be bigger than incValue
Collection.prototype.increment = function (conditions, propName, incValue, threshhold, cb) {
	if (!incValue) {
		return cb(new Error('invalidIncrementvalue'));
	}
	if (incValue > threshhold) {
		return cb(new Error('incrementValueExceedsMax'));
	}
	logger.verbose('incrementing a property of document(s) in mongodb:', this._name, conditions, incValue, threshhold);
	var that = this;
	var update = { $inc: {} };
	update.$inc[propName] = incValue;
	conditions[propName] = {
		$lte: threshhold - incValue
	};
	this._collection.update(conditions, update, function (error, res) {
		if (error) {
			return cb(error);
		}
		if (!res) {
			return cb(new Error('blockedExceedMaxIncrement'));
		}
		logger.info('incremented a property of document(s) in mongodb:', that._name, conditions, incValue, threshhold);
		cb(null, res);
	});
};

// decrementValue must NOT be zero or negative
// value = value - decrementValue where value >= decrementValue
// this operation will prevent the target value to go below 0
Collection.prototype.decrement = function (conditions, propName, decrementValue, cb) {
	
	if (!decrementValue) {
		return cb(new Error('invalidDecrementValue'));
	}

	logger.verbose('decrementing a property of document(s) in mongodb:', this._name, conditions, decrementValue);

	var that = this;
	var update = { $inc: {} };
	update.$inc[propName] = -1 * decrementValue;
	conditions[propName] = {
		$gte: decrementValue
	};

	this._collection.update(conditions, update, function (error, res) {
		if (error) {
			return cb(error);
		}
		if (!res) {
			return cb(new Error('blockedNegativeDecrement'));
		}
		logger.info('decremented a property of document(s) in mongodb:', that._name, conditions, decrementValue);
		cb(null, res);
	});

};

/*
values: { object to be deleted }

to delete more than one document
values: { keyToMatch: { '$in': [keys to match] } }
*/
Collection.prototype.delete = function (values, cb) {
	
	logger.verbose('deleting from mongodb:', this._name, values);

	var that = this;

	this._collection.remove(values, function (error) {
		if (error) {
			return cb(error);
		}
		logger.info('deleted from mongodb:', that._name, values);
		cb();
	});
};

// you MUST provide _id for updating
// you can NOT save moe than one document at a time
Collection.prototype.save = function (values, cb) {

	logger.verbose('saving to mongodb:', this._name, values);

	var that = this;

	this._collection.save(values, function (error, res) {
		if (error) {
			return cb(error);
		}
		logger.info('saved to mongodb:', that._name, values);
		cb(null, res);
	});
};

Collection.prototype.findAndModify = function (query, sort, update, options, cb) {
	
	logger.verbose('find and modifying mongodb:', this._name, query, sort, update, options);

	var that = this;

	this._collection.findAndModify(query, sort, update, options, function (error, result) {
		if (error) {
			return cb(error);
		}

		logger.info('find and modified mongodb:', that._name, query, sort, update, options);
		cb(null, result);	
	});
};

Collection.prototype.ensureIndex = function (indexes, options, cb) {
	logger.verbose('adding index(es) to a document in mongodb:', this._name, indexes, options);
	var that = this;
	this._collection.ensureIndex(indexes, options, function (error, res) {
		if (error) {
			return cb(error);
		}
		logger.info('added index(es) to a document in mongodb:', that._name, indexes, options);
		cb(null, res);
	});
};

function extractResults(cursor, cb) {
	var results = [];
	walk(results, cursor, cb);
}

function walk(results, cursor, cb) {
	cursor.nextObject(function (error, doc) {
		if (error) {
			return cb(error);
		}
		if (!doc) {
			// no more result > we consider done
			return cb(null, results);
		}
		results.push(doc);
		walk(results, cursor, cb);
	});
}

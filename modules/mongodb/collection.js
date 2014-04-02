var gracenode = require('GraceNode');
var logger = gracenode.log.create('mongodb-collection');

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
	sort: <object>
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
				cursor = cursor.sort(pagenate.sort).limit(pagenate.limit).skip(pagenate.skip);
			} else {
				cursor = cursor.limit(pagenate.limit).skip(pagenate.skip);
			}
			logger.verbose('query executed:', that._name, query, fields, pagenate);
			return extractResults(cursor, cb);
		}
		// no pagenation
		extractResults(cursor, cb);
	});
};

/*
vlaues: { object to be stored }

to insert more than one document
values: [ {object to be sotred}, {object to be stored}, {...} ]

*/
Collection.prototype.insert = function (values, cb) {
	
	logger.info('inserting to mongodb:', this._name, values);
	
	var that = this;

	this._collection.insert(values, function (error) {
		if (error) {
			return cb(error);
		}
		logger.info('inserted to mongodb:', that._name, values);
		cb();
	});
};

/*
values: { object to be deleted }

to delete more than one document
values: { keyToMatch: { '$in': [keys to match] } }
*/
Collection.prototype.delete = function (values, cb) {
	
	logger.info('deleting from mongodb:', this._name, values);

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

	logger.info('saving to mongodb:', this._name, values);

	var that = this;

	this._collection.save(values, function (error) {
		if (error) {
			return cb(error);
		}
		logger.info('saved to mongodb:', that._name, values);
		cb();
	});
};

Collection.prototype.findAndModify = function (query, sort, update, options, cb) {
	
	logger.info('find and modifying mongodb:', this._name, query, sort, update, options);

	var that = this;

	this._collection.findAndModify(query, sort, update, options, function (error, result) {
		if (error) {
			return cb(error);
		}

		logger.info('find and modified mongodb:', that._name, query, sort, update, options);
		cb(null, result);	
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

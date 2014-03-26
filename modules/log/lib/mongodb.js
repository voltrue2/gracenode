var mongodb = require('mongodb');

var today = require('./today');
var ip = require('./ip');

var options = {
	safe: true,
	upsert: true
};

var address = null;
var config = null;
var db = null;
var collection = null;
var collectionName = 'logger';

module.exports.setup = function (gn, configIn, cb) {
	if (!configIn) {
		// no mongodb logging
		return cb;
	}

	config = configIn;
	
	if (config.collectionName) {
		collectionName = config.collection;
	}
	
	address = ip.get();

	connect(gn, cb);
};

module.exports.log = function (levelName, msg) {
	if (!db || !collection) {
		return;
	}
	var logId = address + ':' + levelName + '.' + today();
	var value = {
		$push: {
			value: msg
		}
	};
	collection.update({ _id: logId }, value, options, function (error) {
		
		console.log('written?', logId, error);

		if (error) {
			console.error('log.mongodb: Error:', error);
		}
	});
};

function connect(gn, cb) {

	// cleaner
	gn._addLogCleaner('log.mongodb', function (done) {
		db.close(function (error) {
			if (error) {
				console.error('log.mongodb: Error:', error);
			}
			db = null;
			collection = null;
			done();
		});
	});
	
	// create a connection pool to mongo db
	var url = 'mongodb://' + config.host + ':' + config.port + '/' + config.database;
	var options = {
		poolSize: config.poolSize || 5
	};
	mongodb.MongoClient.connect(url, options, function (error, dbIn) {
		if (error) {
			console.error('log.mongodb: Error:', error);
			return cb(error);
		}

		db = dbIn;
		collection = db.collection(collectionName);
		cb();
	});
}

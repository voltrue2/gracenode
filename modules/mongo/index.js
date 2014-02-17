var gracenode = require('../../');
var log = gracenode.log.create('mongodb');
var mongoClient = require('mongodb').MongoClient;
var configuration = {};

var _connection;

module.exports.readConfig = function (configIn) {


	if (!configIn.database || !configIn.host || !configIn.port) {

		return new Error('invalid configurations: \n' + JSON.stringify(configIn, null, 4));

	}

	configuration = configIn;
	return true;

};

module.exports.setup = function (cb) {

	mongoClient.connect('mongodb://' + configuration.host + ':' + configuration.port + '/' + configuration.database, { /*TODO: settings */ }, function (error, connection) {
		
		if (error) {
			return cb(error);
		}
		_connection = connection;
		cb();

	});

};

module.exports.create = function (collection) {

	return new MongoDB(collection);

};

function MongoDB(collection) {

	this.collection     = _connection.collection(collection);
	this.collectionName = collection;

}

MongoDB.prototype.set = function (value, cb) {

	if (!value._id) {
		return cb('idFieldNotSet');
	}

	log.info('Saving', value, 'to', this.collectionName);
	this.collection.save(value, cb);

};

MongoDB.prototype.insert = function (key, value, cb) {

	value._id = key;

	log.info('Inserting', value, 'into', this.collectionName);
	this.collection.insert(value, cb);

};

MongoDB.prototype.minsert = function (keys, values, cb) {

	if (keys.length !== values.length) {
		return cb('keysNotMatchingValues');
	}

	for (var i = 0, l = keys.length; i < l; i++) {
		values[i]._id = keys[i];
	}

	log.info('Inserting', values, 'with ids', keys, 'into', this.collectionName);
	this.collection.insert(values, cb);

};

MongoDB.prototype.find = function (key, cb) {

	log.info('Searching', this.collectionName, 'for', key);
	this.collection.findOne({_id: key}, cb);

};

MongoDB.prototype.mfind = function (keys, cb) {


	if (!keys.length) {
		return cb('keysIsNotArray');
	}

	log.info('Searching', this.collectionName, 'for', keys);
	this.collection.find({ _id: { '$in': keys }}, {}, cb);

};

MongoDB.prototype.remove = function (key, cb) {

	log.info('Removing', key, 'from', this.collectionName);
	return this.collection.remove({_id: key}, cb);

};

MongoDB.prototype.mremove = function (keys, cb) {

	if (!keys.length) {
		return cb('keysIsNotArray');
	}

	log.info('Removing', keys, 'from', this.collectionName);
	this.collection.remove({ _id: { '$in': keys }}, cb);

};
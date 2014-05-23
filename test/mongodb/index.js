var assert = require('assert');
var gn = require('../../');
var prefix = require('../prefix');

describe('mongodb module ->', function () {

	var id = 1;

	var doc = {
		_id: id,
		key: 'test',
		value: [0, 1, 2],
		num: 0
	};

	var collection;

	it('Can create connections', function (done) {

		console.log('For this unit test, you need to have mongodb running at mongo://127.0.0.1:27017');
		
		gn.setConfigPath(prefix + 'gracenode/test/configs/');
		gn.setConfigFiles(['mongodb.json']);
		gn.use('mongodb');
		gn.setup(function (error) {
			assert.equal(error, undefined);
			var db = gn.mongodb.create('test');
			collection = db.collection('unit-test');
			assert(collection);
			done();
		});

	});

	it('Can add an index to a collection', function (done) {
		collection.ensureIndex({ key: 1 }, null, function (error) {
			assert.equal(error, undefined);
			done();
		});
	});

	it('Can insert a document and find it', function (done) {
		collection.insert(doc, function (error) {
			assert.equal(error, undefined);
			collection.findOne({ _id: id }, [], function (error, item) {
				assert.equal(error, undefined);
				assert.equal(item._id, doc._id);
				assert.equal(item.key, doc.key);
				assert.equal(item.value[0], doc.value[0]);
				assert.equal(item.value[1], doc.value[1]);
				assert.equal(item.value[2], doc.value[2]);
				assert.equal(item.num, 0);
				done();
			});
		});
	});

	it('Can update a document and find', function (done) {
		collection.update(doc, { $push: { value: 3 } }, function (error) {
			assert.equal(error, undefined);
			collection.findOne({ _id: id }, [], function (error, item) {
				assert.equal(error, undefined);
				assert.equal(item._id, doc._id);
				assert.equal(item.key, doc.key);
				assert.equal(item.value[0], doc.value[0]);
				assert.equal(item.value[1], doc.value[1]);
				assert.equal(item.value[2], doc.value[2]);
				assert.equal(item.value[3], 3);
				done();
			});
		});
	});
	
	it('Can increment', function (done) {
		collection.increment({ _id: id }, 'num', 10, 100, function (error) {
			assert.equal(error, undefined);
			collection.findOne({ _id: id }, [], function (error, item) {
				assert.equal(error, undefined);
				assert.equal(item.num, 10);
				done();
			});
		});
	});

	it('Can prevent increment if it exceeds the maximum allowed', function (done) {
		collection.increment({ _id: id }, 'num', 91, 100, function (error) {
			assert(error);
			collection.findOne({ _id: id }, [], function (error, item) {
				assert.equal(error, undefined);
				assert.equal(item.num, 10);
				done();
			});
		});
	});
	
	it('Can increment to maxmimun', function (done) {
		collection.increment({ _id: id }, 'num', 90, 100, function (error) {
			assert.equal(error, undefined);
			collection.findOne({ _id: id }, [], function (error, item) {
				assert.equal(error, undefined);
				assert.equal(item.num, 100);
				done();
			});
		});
	});
	
	it('Can decrement', function (done) {
		collection.decrement({ _id: id }, 'num', 10, function (error) {
			assert.equal(error, undefined);
			collection.findOne({ _id: id }, [], function (error, item) {
				assert.equal(error, undefined);
				assert.equal(item.num, 90);
				done();
			});
		});
	});

	it('Can prevent derecement if it goes below 0', function (done) {
		collection.decrement({ _id: id }, 'num', 100, function (error) {
			assert(error);
			collection.findOne({ _id: id }, [], function (error, item) {
				assert.equal(error, undefined);
				assert.equal(item.num, 90);
				done();
			});
		});
	});
	
	it('Can decrement to 0', function (done) {
		collection.decrement({ _id: id }, 'num', 90, function (error) {
			assert.equal(error, undefined);
			collection.findOne({ _id: id }, [], function (error, item) {
				assert.equal(error, undefined);
				assert.equal(item.num, 0);
				done();
			});
		});
	});

	it('Can upsert a document', function (done) {
		collection.upsert({ _id: 2, key: 'test', value: [4, 5, 6] }, { _id: 2, key: 'test', value: [4, 5, 6] }, false, function (error) {
			assert.equal(error, undefined);
			collection.findOne({ _id: 2 }, [], function (error, item) {
				assert.equal(error, undefined);
				assert.equal(item._id, 2);
				assert.equal(item.key, doc.key);
				assert.equal(item.value[0], 4);
				assert.equal(item.value[1], 5);
				assert.equal(item.value[2], 6);
				done();
			});
			
		});
	});

	it('Can save a document', function (done) {
		collection.save(doc, function (error) {
			assert.equal(error, undefined);
			collection.findOne({ _id: id }, [], function (error, item) {
				assert.equal(error, undefined);
				assert.equal(item._id, doc._id);
				assert.equal(item.key, doc.key);
				assert.equal(item.value[0], doc.value[0]);
				assert.equal(item.value[1], doc.value[1]);
				assert.equal(item.value[2], doc.value[2]);
				assert.equal(item.num, 0);
				done();
			});
		});
	});

	it('Can "findAndModify" a document', function (done) {
		collection.findAndModify({ _id: id }, ['_id'], { $set: { num: 5 } }, { new: true }, function (error, item) {
			assert.equal(error, undefined);
			assert.equal(item.num, 5);
			done();
		});
	});

	it('Can count documents', function (done) {
		collection.count({ key: 'test' }, function (error, count) {
			assert.equal(error, undefined);
			assert.equal(count, 2);
			done();
		});
	});

	it('Can "findMay" documents', function (done) {
		collection.findMany({ key: 'test' }, [], { limit: 2, offset: 0 }, function (error, list) {
			assert.equal(error, undefined);
			assert.equal(list.length, 2);
			done();
		});
	});

	it('Can "findEach" documents', function (done) {
		var list = [];
		collection.findEach({ key: 'test' }, [], 1, null, function (item, next) {
			list.push(item);
			next();
		},
		function (error) {
			assert.equal(error, undefined);
			assert.equal(list.length, 2);
			done();
		});
	});

	it('Can delete documents', function (done) {
		collection.delete({ key: 'test' }, function (error) {
			assert.equal(error, undefined);
			done();
		});
	});

});

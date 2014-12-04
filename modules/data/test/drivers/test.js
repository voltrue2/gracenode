'use strict';

var db = {};

exports.create = function (name, id, data, cb) {
	if (!db[name]) {
		db[name] = {};
	}
	if (db[name][id]) {
		return cb(new Error('duplicateEntry'));
	}
	db[name][id] = data;
	cb();
};

exports.read = function (name, id, cb) {
	if (db[name] && db[name][id]) {
		return cb(null, db[name][id]);
	}
	cb(new Error('notFound'));
};

exports.update = function (name, id, data, cb) {
	if (!db[name] || !db[name][id]) {
		return cb('failedToUpdate');
	}
	db[name][id] = data;
	cb();
};

exports.delete = function (name, id, cb) {
	if (!db[name] || !db[name][id]) {
		return cb('failedToDelete');
	}
	delete db[name][id];
	cb();
};

exports.search = function (name, idList, cb) {
	if (!db[name]) {
		return cb(null, []);
	}
	var res = [];
	for (var i = 0, len = idList.length; i < len; i++) {
		if (db[name][idList[i]]) {
			res.push(db[name][idList[i]]);
		}
	}
	cb(null, res);
};

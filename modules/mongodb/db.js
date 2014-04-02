var Collection = require('./collection');

function Db(name, db) {
	this._name = name;
	this._db = db;
}

Db.prototype.collection = function (name) {
	return new Collection(this._name, name, this._db.collection(name));
};

module.exports = Db;

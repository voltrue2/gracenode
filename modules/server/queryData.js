
exports.createGetter = function (dataObj) {
	var data = new Data(dataObj);
	return data;
};

function Data(dataIn) {
	this._data = dataIn;
}

Data.prototype.get = function (key) {
	if (!key) {
		// get all
		var res = {};
		for (var prop in this._data) {
			res[prop] = this._data[prop];
		}
		return res;
	}
	return this._data[key] !== undefined ? this._data[key] : null;
};

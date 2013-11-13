
module.exports.createGetter = function (dataObj) {
	var data = new Data(dataObj);
	return data;
};

function Data(dataIn) {
	this._data = dataIn;
}

Data.prototype.get = function (key) {
	var res = null;
	if (!key) {
		// get all
		res = {};
		for (var prop in this._data) {
			res[prop] = this._data[prop];
		}
	} else {
		res = this._data[key] !== undefined ? this._data[key] : null;
	}
	try {
		res = JSON.parse(res);
	} catch (error) {
		// res is not a JSON
	}
	return res;
};

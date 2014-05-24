// create labels from parsed CSV data
module.exports.execute = function (parsedCSV) {
	var list = [];
	// first row is the labels
	var labels = parsedCSV[0];
	var jen = labels.length;
	for (var i = 1, len = parsedCSV.length; i < len; i++) {
		var row = parsedCSV[i];
		if (row.length !== jen) {
			throw new Error('malformed CSV data:\n' + JSON.stringify(parsedCSV, null, 4));
		}
		var item = {};
		for (var j = 0; j < jen; j++) {
			item[labels[j]] = row[j];
		}
		list.push(item);
	}
	return list;
};

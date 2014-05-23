var csv = require('csv-string');

module.exports.toObject = parseCSV;

function parseCSV(data) {
	var parsed = csv.parse(data);
	var treated = treatCSV(parsed);
	return treated;
}

function treatCSV(parsed) {
	// first row is the labels
	var names = parsed[0];
	var treated = [];
	for (var i = 1, len = parsed.length; i < len; i++) {
		var items = parsed[i];
		if (names.length !== items.length) {
			throw new Error('malformed CSV data:\n' + JSON.stringify(parsed, null, 4));
		}
		var row = {};
		for (var j = 0, jen = names.length; j < jen; j++) {
			var name = names[j];
			row[name] = enforceDataType(items[j]);
		}
		treated.push(row);
	}
	return treated;
}

function enforceDataType(data) {
	// remove escapes
	data = data.replace(/\\/g, '');
	// enforce data type
	if (data && data.indexOf('0x') === -1 && !isNaN(data)) {
		// numeric value
		var intOrHEX = parseInt(data, 10);
		var floatVal = parseFloat(data);
		if (floatVal && intOrHEX !== floatVal) {
			return floatVal;
		}
		return intOrHEX;
	}
	switch (data.toLowerCase()) {
		case 'true':
			return true;
		case 'false':
			return false;
		case 'null':
			return null;
		case 'undefined':
			return undefined;
		default:
			try {
				return JSON.parse(data);
			} catch (e) {
				return data;
			}
	}
}

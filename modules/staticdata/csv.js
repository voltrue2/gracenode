
module.exports.create = function (quote, delimiter) {
	return new Csv(quote, delimiter);
};

function Csv(quote, delimiter) {
	this._placeHolder = '\t\t';
	this._quote = quote || '';
	this._delimiter = delimiter;
}

Csv.prototype.toObject = function (csv) {
	// separate CSV string by row
	var rows = this._getRows(csv);
	// parse each row
	var parsed = this._parseRows(rows);
	return parsed;
};

Csv.prototype._getRows = function (csv) {
	// replace all linebreaks with \r to elimitnate OS dependent EOL issues
	csv = csv.replace(/(\r\r|\n)/gm, '\r');
	// find and replace escaped delimiter with \t\t
	csv = csv.replace(/\\,/g, this._placeHolder);
	return csv.split('\r');
};

Csv.prototype._parseRows = function (rows) {
	var parsedRows = [];
	var colNames = null;
	var colLen = 0;
	for (var i = 0, len = rows.length; i < len; i++) {
		if (!rows[i]) {
			// ignore empty row
			continue;
		}
		
		var row = this._parseRow(rows[i]);
		
		if (i === 0) {
			// we assume the first row to be column names
			colNames = row;
			colLen = colNames.length;
		} else {
			parsedRows.push(this._createRowObj(colNames, colLen, row));			
		}
	}

	return parsedRows;
};

Csv.prototype._parseRow = function (row) {
	var startIndex = '';
	var endIndex = startIndex + this._delimiter;
	var startIndexLen = startIndex.length;
	var cols = [];

	while (row.length) {
		var startPos = row.indexOf(startIndex) + startIndexLen;
		var endPos = row.indexOf(endIndex);
		var match = row.substring(startPos, endPos);

		var value = '';		

		// check if we have reached the end
		if (!match || match === startIndex) {
			value = row.substring(row.indexOf(startIndex) + startIndexLen, row.lastIndexOf(startIndex));
			row = '';
		} else {
			value = match;

			row = row.replace(startIndex + match + endIndex, '');
		}
	
		// strip quote if present
		if (value.indexOf(this._quote) === 0) {
			value = value.substring(1);
		}
		if (value.substring(value.length - 1) === this._quote) {
			value = value.substring(0, value.length - 1);
		}
	
		cols.push(value);
	}

	// revert the place holder back to escaped delimiter
	for (var i = 0, len = cols.length; i < len; i++) {
		cols[i] = cols[i].replace(this._placeHolder, this._delimiter);
	}
	return cols;
};

Csv.prototype._createRowObj = function (colNames, colNameLen, cols) {
	if (colNameLen !== cols.length) {
		throw new Error('incorrect CSV file: ' + JSON.stringify(colNames) + ' > ' + JSON.stringify(cols));
	}

	var item = {};
	for (var i = 0, len = colNameLen; i < len; i++) {
		item[colNames[i]] = correctDataType(cols[i]);
	}
	return item;
};

function correctDataType(data) {
	if (data && data.indexOf('0x') === -1 && !isNaN(data)) {
		var intOrHex = parseInt(data, 10);
		var floatNum = parseFloat(data);
		if (floatNum && intOrHex !== floatNum) {
			return floatNum;
		} else {
			return intOrHex;
		}
	} else if (data === 'TRUE' || data === 'true') {
		return true;
	} else if (data === 'FALSE' || data === 'false') {
		return false;
	} else if (data === 'NULL' || data === 'null') {
		return null;
	} else {
		try {
			return JSON.parse(data);
		} catch (e) {
			return data;
		}
	}
}

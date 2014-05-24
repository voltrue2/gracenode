var delimiterEscapeMap = {
	'\t': '\\t',
	',': '\\,',
	'|': '\\|',
	';': '\\;',
	'^': '\\^'
};
var delimiter;
var escaped;

module.exports.setup = function (delimiterIn) {
	delimiter = delimiterIn;
	escaped = delimiterEscapeMap[delimiter] || null;
	if (!escaped) {
		throw new Error('given delimiter is not supported: ' + delimiter);
	}
};

module.exports.parse = parse;

function parse(data) {
	var list = [];
	var rows = separateRows(data);
	for (var i = 0, len = rows.length; i < len; i++) {
		var separated = separateColumns(rows[i]);
		if (separated.length) {
			list.push(separated);
		}	
	}
	return list;
}

function separateRows(data) {
	// replace all linebreaks with \r to elimitnate OS dependent EOL issues
	data = data.replace(/(\r\r|\n)/gm, '\r');
	return data.split('\r');
}

function separateColumns(row) {
	// separated list of columns
	var columns = [];
	// copy of row to keep track of the current position
	var tmp = row;
	// delimiter poisition
	var index = tmp.indexOf(delimiter);
	// remember the escaped column value to be pushed in later
	var escapedCol = '';
	// find and separate (if delimiter is escaped with \ ignore and skip)
	while (index !== -1) {
		// split
		var separated = tmp.substring(0, index + 1);
		// check for escape
		if (separated.indexOf(escaped) === -1) {
			// if there is escaped column value that needs to be pushed in, push it in now
			if (escapedCol !== '') {
				columns.push(typeCast(escapedCol + separated.substring(0, separated.length - 1)));
				// reset escaped
				escapedCol = '';
			} else {
				// delimiter is not escaped. we keep the separated item as a column value
				columns.push(typeCast(separated.substring(0, separated.length - 1)));
			}
		} else {
			// escaped delimiter detected. append it to escaped
			escapedCol += separated;
		}
		// update the current position
		tmp = tmp.replace(separated, '');
		index = tmp.indexOf(delimiter);
	}
	// check for the left over
	if (tmp !== '') {
		if (escapedCol !== '') {
			// both tmp and escapedCol
			columns.push(typeCast(escapedCol + tmp));
		} else {
			// tmp only
			columns.push(typeCast(tmp));
		}
	}
	return columns;
}

function typeCast(data) {
	// strip double quotes
	if (data.indexOf('"') === 0) {
		data = data.substring(1);
	}
	if (data.substring(data.length - 1) === '"') {
		data = data.substring(0, data.length - 1);
	}
	// cast type
	if (data && data.indexOf('0x') === -1 && !isNaN(data)) {
		// numeric data
		var intOrHexVal = parseInt(data, 10);
		var floatVal = parseFloat(data);
		if (floatVal && intOrHexVal !== floatVal) {
			return floatVal;
		} else {
			return intOrHexVal;
		}
	}
	// non numeric data
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
				// remove unnecessary backslash
				while (data.indexOf(escaped) !== -1) {
					data = data.replace(escaped, delimiter);
				}
				return data;
			}
	}
}

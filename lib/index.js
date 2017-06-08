'use strict';

const fs = require('fs');
const datetime = require('node-datetime');
const validationPatterns = {
	numeric: /^\d+$/,
	alphaNumeric: /^[a-z0-9]+$/i,
	password: /^[a-z0-9\@\!\_\-\+\=\$\%\#\?]/i
};

module.exports.CryptoEngine = require('./packet/cryptoengine');

module.exports.packet = require('./transport');

module.exports.uuid = require('./uuid');

// backward compatibility: 2017/06/08 v3.7.2
module.exports.now = function () {
	return Date.now();
};

module.exports.showBuffer = function __showBuffer(buf) {
	return buf.join(' ');
};

module.exports.byte = function __byte(size) {
	if (Buffer.alloc) {
		return Buffer.alloc(size);
	}
	return new Buffer(size);
};

// perform a binary search on an array of objects based on the given "key"
// list must be pre-sorted on the key
module.exports.bsearch = function __bsearch(list, key, value) {
	var min = 0;
	var max = list.length - 1;
	var index;
	var current;
	while (min <= max) {
		index = (min + max) / 2 | 0;
		current = list[index];
		if (current[key] < value) {
			min = index + 1;
		} else if (current[key] > value) {
			max = index - 1;
		} else {
			return index;
		}
	}
	return -1;
};

// perform a semi binary search by range on an array of objects based on the given "key"
module.exports.brange = function __brange(list, key, min, max) {
	var lres = [];
	var rres = [];
	var left = 0;
	var len = list.length;
	var right = len - 1;
	var middle = len / 2 | 0;
	while (left <= middle && right >= middle) {
		if (list[left][key] > max || list[right][key] < min) {
			break;
		}
		if (list[left][key]>= min) {
			lres.push(list[left]);
		}
		if (list[right][key] <= max) {
			rres.push(list[right]);
		}
		left += 1;
		right -= 1;
	}
	return lres.concat(rres.reverse());
};

module.exports.xor = function __libXor(a, b) {
	var res = [];
	var i;
	
	if (!Buffer.isBuffer(a)) {
		a = new Buffer(a);
	}
	if (!Buffer.isBuffer(b)) {
		b = new Buffer(b);
	}

	const alen = a.length;
	const blen = b.length;

	if (alen > blen) {
		for (i = 0; i < blen; i++) {
			res.push(a[i] ^ b[i]);
		}
		return new Buffer(res);
	}
	
	for (i = 0; i < alen; i++) {
		res.push(a[i] ^ b[i]);
	}
	return new Buffer(res);
};

module.exports.padNumber = function __libPadNumber(n, digit) {
	if (!digit) {
		digit = 2;
	}
	var nStr = n.toString();
	while (nStr.length < digit) {
		nStr = '0' + nStr;
	}
	return nStr;
};

// returns an array of date objects between start date object and end date object
module.exports.getDates = function __libGetDates(startDateObj, endDateObj) {
	var dt = datetime.create(startDateObj);
	return dt.getDatesInRange(endDateObj).map(function __libGetDatesMap(item) {
		return item._now;
	});
};

module.exports.createDateTime = function __libCreateDateTime(time, defaultFormat) {
	return datetime.create(time, defaultFormat);
};

/*
conf: {
	max: [number],
	min: [number],
	interval: [number], // update interval
	step: [number], // update step e.g. is step = 2, it will inc/dec 2 every interval
	type: [string], // inc: increment, dec: decrement
	initValue: [number], // cannot be greater than max and smaller than min
}
*/
module.exports.createTimedData = function __libCreateTimedData(conf) {
	return datetime.createTimedNumber(conf);
};

module.exports.createTimedState = function __libCreateTimedState(conf) {
	return datetime.createTimedState(conf);
};

module.exports.find = function __libFind(obj, findFunc) {
	if (typeof obj !== 'object') {
		throw new Error('the first argument must be an object/array');
	}
	if (typeof findFunc !== 'function') {
		throw new Error('the second argument must be a function');
	}
	var res = [];
	if (Array.isArray(obj)) {
		var left = 0;
		var right = obj.length - 1;
		var middle = obj.length / 2 | 0;
		while (left <= middle && right >= middle) {
			if (findFunc(obj[left])) {
				res.push({ index: left, element: obj[left] });
			}
			if (findFunc(obj[right])) {
				res.push({ index: right, element: obj[right] });
			}
			left += 1;
			right -= 1;
		}
		return res;
	}
	for (var key in obj) {
		if (findFunc(obj[key])) {
			res.push({ index: key, element: obj[key] });
		}
	}
	return res;
};

module.exports.typeCast = function __libTypeCast(data) {
	if (isNaN(data)) {
		// none numeric data
		switch (data.toLowerCase()) {
			case 'undefined':
				return undefined;
			case 'null':
				return null;
			case 'true':
				return true;
			case 'false':
				return false;
		}
		try {
			// object
			return JSON.parse(data);
		} catch (e) {
			// string
			return data;
		}
	}
	// numerice data
	if (data.indexOf('.') !== -1) {
		return parseFloat(data);
	}
	return parseInt(data, 10);
};

/**
* The random functions work as follows:
*
* Lets say we need a random number between 50 and 60.
* We substract 50 from 60, which leaves us with 10.
* We then find a random number in 10.
* Add this number to the minimum value.
*
* Previously, by returning MIN if RAND is smaller than MIN, we create an unfair bias towards
* the MIN number. For example, randomInt(99,100) is going to return 99, 
* 99% of time. Not 50% as it should be.
*/

module.exports.randomFloat = function __libRandomFloat(min, max, precision) {
	precision = precision || 2;
	var offset = max - min;
	return parseFloat(Math.min(min + (Math.random() * offset), max).toFixed(precision));
};

module.exports.randomInt = function __libRandomInt(min, max) {

	var offset = max - min;
	var rand   = Math.floor(Math.random() * (offset + 1));

	return rand + min;

};

module.exports.randomArray = function __libRandomArray(list) {
	var max = list.length - 1;
	var index = module.exports.randomInt(0, max);
	return list[index];
};

module.exports.getArguments = function __libGetArguments(func) {
	var names = func.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/);
	var args = names[1].replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '');
	args = args.replace(/\s+/g, '').split(',');
	return args.length === 1 && !args[0] ? [] : args;
};

// this function never gets optimized by v8 compiler
module.exports.cloneObj = function __libCloneObj(obj, props) {
	if (obj === null || typeof obj !== 'object') {
		return obj;
	}
	var res = null;
	if (Array.isArray(obj)) {
		res = [];
	} else {
		res = {};
	}
	for (var prop in obj) {
		if (isNaN(prop) && props && props.indexOf(prop) === -1) {
			continue;
		}
		if (obj[prop] !== null && typeof obj[prop] === 'object') {
			res[prop] = module.exports.cloneObj(obj[prop], props);
		} else {
			res[prop] = obj[prop];
		}
	}
	return res;
};

module.exports.deepCopy = function __libDeepCopy(obj) {
	if (Array.isArray(obj)) {
		return obj.concat([]);
	}
	return JSON.parse(JSON.stringify(obj));
};

/*
* params: { pattern: 'numeric' or 'alphaNumeric', alloweSpace: true or false, allowHTML: true or false }
*
**/
module.exports.validateInput = function __libValidateInput(input, minLen, maxLen, params) {
	var allowHTML = params && params.allowHTML || false;
	var allowSpace = params && params.allowSpace || false;
	var pattern = params && params.pattern && validationPatterns[params.pattern] || null;
	var len = input.length;

	// length check
	if (len < minLen || len > maxLen) {
		return false;
	}

	// HTML check
	if (!allowHTML && input.match(/(<([^>]+)>)/ig)) {
		return false;
	}

	// space check
	if (!allowSpace && input.match(' ')) {
		return false;
	}

	// pattern check
	if (pattern && !input.match(pattern)) {
		return false;
	}

	return true;
};

// returns a single-dimension array of all files with full paths in the given directory path
module.exports.walkDir = function __libWalkDir(path, cb) {
	var res = [];
	var pending = 0;
	var eachWalk = function __libEachWalk(error, results) {
		if (error) {
			return cb(error);
		}
		res = res.concat(results);
		pending--;
		if (!pending) {
			return cb(null, res);
		}
	};
	fs.lstat(path, function __libWalkOnStat(error, stat) {
		if (error) {
			return cb(error);
		}
		if (!stat.isDirectory()) {
			res.push({ file: path, stat: stat });
			return cb(null, res);
		}
		fs.readdir(path, function __libWalkOnReaddir(error, list) {
			if (error) {
				return cb(error);
			}
			pending += list.length;
			if (!pending) {
				return cb(null, res);
			}
			for (var i = 0, len = list.length; i < len; i++) {
				var file = list[i];
				var slash = path.substring(path.length - 1) !== '/' ? '/' : '';
				var filePath = path + slash + file;
				module.exports.walkDir(filePath, eachWalk);
			}
		});
	});
};

module.exports.chunkSplit = function __libChunkSplit(str, len, end) {
	len = parseInt(len, 10) || 76;
	if (len < 1) {
		return false;
	}
	end = end || '\r\n';
	return str.match(new RegExp('.{0,' + len + '}', 'g')).join(end);
};

module.exports.chr = function __libChr(codePoint) {
	if (codePoint > 0xffff) {
		codePoint -= 0x10000;
		return String.fromCharCode(0x800 + (codePoint >> 10), 0xdc00 + (codePoint & 0x3ff));
	}
	return String.fromCharCode(codePoint);
};

module.exports.ord = function __libOrd(str) {
	// force it to be a string
	str += '';
	
	var code = str.charCodeAt(0);

	if (0xd800 <= code && code <= 0xdbff) {
		if (str.length === 1) {
			return code;
		}

		var high = code;
		var low = str.charCodeAt(1);

		return ((high - 0xd800) * 0x400 + (low - 0xdc00) + 0x10000);
	}
	
	if (0xdc00 <= code && code <= 0xdfff) {
		return null;
	}

	return code;

};


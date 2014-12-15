'use strict';

var fs = require('fs');
var TimedData = require('./lib/timeddata');
var validationPatterns = {
	numeric: /^\d+$/,
	alphaNumeric: /^[a-z0-9]+$/i,
	password: /^[a-z0-9\@\!\_\-\+\=\$\%\#\?]/i
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
module.exports.createTimedData = function (conf) {
	return new TimedData(conf);
};

module.exports.find = function (obj, findFunc) {
	if (typeof obj !== 'object') {
		throw new Error('the first argument must be an object/array');
	}
	if (typeof findFunc !== 'function') {
		throw new Error('the second argument must be a function');
	}
	var res = [];
	if (Array.isArray(obj)) {
		for (var i = 0, len = obj.length; i < len; i++) {
			if (findFunc(obj[i])) {
				res.push({ index: i, element: obj[i] });
			}
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

module.exports.typeCast = function (data) {
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
* 99% of time time. Not 50% as it should be.
*/

module.exports.randomFloat = function (min, max, precision) {
	precision = precision || 2;
	var offset = max - min;
	return parseFloat(Math.min(min + (Math.random() * offset), max).toFixed(precision));
};

module.exports.randomInt = function (min, max) {

	var offset = max - min;
	var rand   = Math.floor(Math.random() * (offset + 1));

	return rand + min;

};

module.exports.randomArray = function (list) {
	var max = list.length - 1;
	var index = module.exports.randomInt(0, max);
	return list[index];
};

module.exports.getArguments = function (func) {
	var names = func.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/);
	var args = names[1].replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '');
	args = args.replace(/\s+/g, '').split(',');
	return args.length === 1 && !args[0] ? [] : args;
};

// this function never gets optimized by v8 compiler
module.exports.cloneObj = function (obj, props) {
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

/*
* params: { pattern: 'numeric' or 'alphaNumeric', alloweSpace: true or false, allowHTML: true or false }
*
**/
module.exports.validateInput = function (input, minLen, maxLen, params) {
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
module.exports.walkDir = function (path, cb) {
	var res = [];
	var pending = 0;
	var eachWalk = function (error, results) {
		if (error) {
			return cb(error);
		}
		res = res.concat(results);
		pending--;
		if (!pending) {
			return cb(null, res);
		}
	};
	fs.lstat(path, function (error, stat) {
		if (error) {
			return cb(error);
		}
		if (!stat.isDirectory()) {
			res.push({ file: path, stat: stat });
			return cb(null, res);
		}
		fs.readdir(path, function (error, list) {
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

module.exports.chunkSplit = function (str, len, end) {
	len = parseInt(len, 10) || 76;
	if (len < 1) {
		return false;
	}
	end = end || '\r\n';
	return str.match(new RegExp('.{0,' + len + '}', 'g')).join(end);
};

module.exports.chr = function (codePoint) {
	if (codePoint > 0xffff) {
		codePoint -= 0x10000;
		return String.fromCharCode(0x800 + (codePoint >> 10), 0xdc00 + (codePoint & 0x3ff));
	}
	return String.fromCharCode(codePoint);
};

module.exports.ord = function (str) {
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


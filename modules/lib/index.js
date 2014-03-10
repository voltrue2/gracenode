
var fs = require('fs');
var gracenode = require('../../');
var log = gracenode.log.create('lib');
var validationPatterns = {
	numeric: /^\d+$/,
    alphaNumeric: /^[a-z0-9]+$/i,
    password: /^[a-z0-9\@\!\_\-\+\=\$\%\#\?]/i
};

module.exports.randomFloat = function (min, max) {
	var rand = Math.random() * ((max - min) + min);
	if (rand < min) {
		return min;
	}
	return rand;
};

module.exports.randomInt = function (min, max) {
	var rand = Math.floor(Math.random() * (max + 1));
	if (rand < min) {
		return min;
	}
	return rand;
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

module.exports.cloneObj = function (obj) {
	if (obj === null || typeof obj !== 'object') {
		return obj;
	}
	var res = null;
	if (Array.isArray(obj)) {
		res = [];
	} else {
		res = {};
	}
	for (var key in obj) {
		if (obj[key] !== null && typeof obj[key] === 'object') {
			res[key] = module.exports.cloneObj(obj[key]);
		} else {
			res[key] = obj[key];
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

module.exports.walkDir = function (path, cb) {
	var res = [];
	fs.lstat(path, function (error, stat) {
		if (error) {
			return cb(error);
		}
		if (!stat.isDirectory()) {
			log.verbose('file:', path);
			res.push({ file: path, stat: stat });
			return cb(null, res);
		}
		fs.readdir(path, function (error, list) {
			if (error) {
				return cb(error);
			}
			var pending = list.length;
			if (!pending) {
				return cb(null, res);
			}
			list.forEach(function (file) {
				var slash = path.substring(path.length - 1) !== '/' ? '/' : '';
				var filePath = path + slash + file;
				fs.stat(filePath, function (error, stat) {
					if (error) {
						return cb(error);
					}
					if (stat.isDirectory()) {
						return module.exports.walkDir(filePath, function (error, resultList) {
							if (error) {
								return cb(error);
							}
							res = res.concat(resultList);
							pending--;
							if (!pending) {
								cb(null, res);
							}
						});
					}
					log.verbose('file:', filePath);
					res.push({ file: filePath, stat: stat });
					pending--;
					if (!pending) {
						cb(null, res);
					}
				});
			});
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
		log.error('invalid value given to ord:', code);
		return null;
	}

	return code;

};


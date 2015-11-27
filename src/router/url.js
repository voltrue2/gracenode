'use strict';

var REP = /{(.*?)}/g;

exports.convert = function (path, sensitive) {
	var match = path.replace(REP, '[^\/]*[^\/]');
	var extract = path.replace(REP, '(.*?)');
	if (sensitive) {
		return {
			pmatch: match,
			match: new RegExp(match),
			extract: new RegExp(extract)
		};
	}
	return {
		pmatch: match,
		match: new RegExp(match, 'i'),
		extract: new RegExp(extract, 'i')
	};
};

exports.match = function (path, regex) {
	return regex.exec(path);
};

exports.extract = function (path, regex) {
	return path.match(regex);
};

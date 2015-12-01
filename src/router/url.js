'use strict';

var REP = /{(.*?)}/g;
var PAT = '([^\\/]+?)';
var LPAT = '(?:\/(?=$))?$';

exports.convert = function (path, sensitive) {
	if (!path.match(REP)) {
		// fast routing: no URL parameters
		path = sensitive ? path.toLowerCase() : path;
		if (path[path.length - 1] === '/') {
			path = path.substring(0, path.length - 1);
		}
		return {
			fast: true,
			path: path,
			sensitive: sensitive
		};
	}
	path = path.replace('\/', '^\/'); 
	var match = path.replace(REP, '[^\/]*[^\/]');
	var ext = path.replace(REP, PAT);
	var lindex = ext.lastIndexOf(PAT);
	if (lindex !== -1) {
		if (ext[ext.length - 1] === '/') {
			ext = ext.substring(0, ext.length - 1);
		}
		ext += LPAT; 
	}
	if (sensitive) {
		return {
			pmatch: match,
			pextract: ext,
			match: new RegExp(match),
			extract: new RegExp(ext)
		};
	}
	return {
		pmatch: match,
		pextract: ext,
		match: new RegExp(match, 'i'),
		extract: new RegExp(ext, 'i')
	};
};

exports.match = function (path, regex) {
	return regex.exec(path);
};

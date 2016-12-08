'use strict';

const REP = /{(.*?)}/g;
const STAT = '/{static:staticfile}';
const PAT = '([^\\/]+?)';
const LPAT = '(?:\/(?=$))?$';

exports.convert = function __httpUrlCovert(path, sensitive) {
	const staticPath = path.indexOf(STAT);
	if (!path.match(REP) && staticPath === -1) {
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
	var match;
	var ext;
	if (staticPath !== -1) {
		// static route or regex route
		match = path.replace(STAT, '(.*?)');
		ext = path.replace(STAT, '(.*)$');
	} else {
		// URL with parameters
		match = path.replace(REP, '[^\/]*[^\/]');
		ext = path.replace(REP, PAT);
	}
	const lindex = ext.lastIndexOf(PAT);
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

exports.match = function __httpUrlMatch(path, regex) {
	return regex.exec(path);
};

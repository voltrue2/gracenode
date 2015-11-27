'use strict';

var REP = /{(.*?)}/g;
var PAT = '([^\\/]+?)';
var LPAT = '(?:\/(?=$))?$';
var PLEN = PAT.length;

exports.convert = function (path, sensitive) {
	path = path.replace('\/', '^\/'); 
	var match = path.replace(REP, '[^\/]*[^\/]');
	var ext = path.replace(REP, PAT);
	var lindex = ext.lastIndexOf(PAT);
	if (lindex !== -1) {
		ext = ext.substring(0, lindex + PLEN) + LPAT + ext.substring(lindex + PLEN); 
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

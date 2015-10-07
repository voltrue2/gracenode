'use strict';

module.exports = function (path) {
	if (!path) {
		throw new Error('invalid application path given: ' + path);
	}
	var sockName = '/tmp/gracenode-monitor-' + path.replace(/\//g, '-') + '.sock';
	return sockName;
};

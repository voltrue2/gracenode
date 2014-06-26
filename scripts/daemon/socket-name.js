module.exports = function (path) {
	if (!path) {
		throw new Error('cannot start application without the application path');
	}
	var sockName = '/tmp/gracenode-monitor-' + path.replace(/\//g, '-') + '.sock';
	return sockName;
};

// cannot use strict mode because we use Octal literals for colors

var COLORS = {
	RED: '0;31',
	GREEN: '0;32',
	DARK_BLUE: '0;34',
	BLUE: '0;36',
	BROWN: '0;33',
	PURPLE: '0;35',
	GREY: '0;90'
};

var logger;
var useColor = false;

var gn = require('../../../gracenode');

exports.setup = function __lintLinterPrintSetup() {
	logger = gn.log.create('lint');
};

exports.useColor = function __lintLinterUseColor() {
	useColor = true;
};

exports.out = function __lintLinterPrintOut() {
	if (!gn._isLogging || !gn.log.isEnabled('verbose')) {
		return;
	}
	var str = '';
	for (var i = 0, len = arguments.length; i < len; i++) {
		str += prep(arguments[i]);
	}
	logger.verbose(str);
};

exports.error = function __lintLinterPrintError() {
	var str = '';
	for (var i = 0, len = arguments.length; i < len; i++) {
		if (arguments[i] instanceof Error) {
			str += arguments[i].message + '\n';
			str += arguments[i].stack + '\n';
			continue;
		}
		str += prep(arguments[i]);
	}
	logger.error(str);
};

exports.verbose = function __lintLinterPrintVerbose() {
	if (!gn._isLogging || !gn.log.isEnabled('verbose')) {
		return;
	}
	var str = '';
	for (var i = 0, len = arguments.length; i < len; i++) {
		str += prep(arguments[i]);
	}
	logger.verbose(color(str, COLORS.BROWN));
};

exports.n = function __lintLinterPrintN(msg) {
	return color(msg, COLORS.GREY);
};

exports.r = function __lintLinterPrintR(msg) {
	return color(msg, COLORS.RED);
};

exports.g = function __lintLinterPrintG(msg) {
	return color(msg, COLORS.GREEN);
};

exports.b = function __lintLinterPrintB(msg) {
	return color(msg, COLORS.DARK_BLUE);
};

exports.y = function __lintLinterPrintY(msg) {
	return color(msg, COLORS.BROWN);
};

exports.p = function __lintLInterPrintP(msg) {
	return color(msg, COLORS.PURPLE);
};

function prep(msg) {
	if (typeof msg === 'object') {
		return '\n' + JSON.stringify(msg, 2, null) + '\n';
	}
	return msg + ' ';
}

function color(str, colorCode) {
	if (!useColor) {
		return str;
	}
	return '\033[' + colorCode + 'm' + str + '\033[0m';
}

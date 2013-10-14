exports.errorMsg = function () {
	var msg = '';
	for (var i = 0, len = arguments.length; i < len; i++) {
		var arg = arguments[i];
		if (typeof arg === 'object') {
			arg = JSON.stringify(arg, null, 4);
		}
		msg += arg + '\n';
	}
	return msg;
};

exports.randomInt = function (min, max) {
	var rand = Math.floor(Math.random() * (max + 1));
	if (rand < min) {
		return min;
	}
	return rand;
};

exports.getArguments = function (func) {
	var names = func.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/);
	var args = names[1].replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
	args = args.replace(/\s+/g, '').split(',');
	return args.length == 1 && !args[0] ? [] : args;
};

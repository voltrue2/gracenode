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


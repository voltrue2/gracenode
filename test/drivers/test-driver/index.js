var config;

exports.module = null;

exports.config = function (configIn) {
	config = configIn;
};

exports.setup = function (cb) {
	cb();
};

exports.expose = function () {
	var exposed = {
		module: module,
		test: config
	};
	return exposed;
};

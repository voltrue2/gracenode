var config;

exports.module = null;

exports.config = function (configIn) {
	config = configIn;
};

exports.setup = function (cb) {
	cb();
};

exports.expose = function () {
	return {
		module: module,
		test: config
	}
};

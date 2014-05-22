exports.module = null;

exports.config = function (configIn) {
	exports.module.config(configIn);
};

exports.setup = function (cb) {
	if (!module.exports.module.isValidated) {
		return cb(new Error('failed to get module'));
	}
	cb();
};

var mod;

module.exports.set = function (module) {
	mod = module;
}; 

module.exports.config = function (configIn) {
	mod.config(configIn);
};

module.exports.setup = function (cb) {
	cb();
};

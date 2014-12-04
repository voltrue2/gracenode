var ModelDefinition = require('./lib/model-definition');

exports.defineModel = function (name, driver) {
	return new ModelDefinition(name, driver);
};

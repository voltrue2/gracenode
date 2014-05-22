var gn;
var drivers = {};

module.exports.setup = function (gracenode) {
	gn = gracenode;
};

module.exports.addDriver = function (moduleName, driver) {
	if (!drivers[moduleName]) {
		drivers[moduleName] = driver;
		return;
	}
};

module.exports.applyDriver = function (name, module) {
	var driver = getDriver(name);
	if (!driver) {
		return false;
	}
	// pass module to driver
	driver.module = module;
	// configuration driver
	if (typeof driver.config === 'function') {
		module.readConfig = driver.config;
	}
	// setup driver
	if (typeof driver.setup === 'function') {
		module.setup = driver.setup;
	}
	// gracenode shutdown task driver
	if (typeof driver.shutdown === 'function') {
		gn.registerShutdownTask(name, function (done) {
			driver.shutdown(gn, done);
		});
	}
	// exposure driver to expose the module as
	if (typeof driver.expose === 'function') {
		var exposed = driver.expose();
		if (!exposed) {
			return new Error('invalid driver.expose given for module [' + name + ']');
		}
		module = exposed;
	}
	return true;
};

function getDriver(moduleName) {
	// look for custom driver first
	if (drivers[moduleName]) {
		return drivers[moduleName];
	}
	return null;
}

var gn;
var logger;
var drivers = {};

module.exports.setup = function (gracenode) {
	gn = gracenode;
	logger = gn.log.create('driver');
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
		logger.verbose('driver for module [' + name + '] not found');
		return false;
	}
	logger.verbose('driver for module [' + name + '] found');
	// pass module to driver
	driver.module = module;
	// configuration driver
	if (typeof driver.config === 'function') {
		logger.verbose('applying driver.config to module [' + name + ']');
		if (!validateDriverFuncArgs(name, 'config', driver.config, 1)) {
			return new Error('invalid driver.config given for module [' + name + ']');
		}
		module.readConfig = driver.config;
	}
	// setup driver
	if (typeof driver.setup === 'function') {
		logger.verbose('applying driver.setup to module [' + name + ']');
		if (!validateDriverFuncArgs(name, 'setup', driver.setup, 1)) {
			return new Error('invalid driver.setup given for module [' + name + ']');
		}
		module.setup = driver.setup;
	}
	// gracenode shutdown task driver
	if (typeof driver.shutdown === 'function') {
		logger.verbose('applying driver.shutdown to module [' + name + ']');
		if (!validateDriverFuncArgs(name, 'shutdown', driver.shutdown, 2)) {
			return new Error('invalid driver.shutdown given for module [' + name + ']');
		}
		gn.registerShutdownTask(name, function (done) {
			driver.shutdown(gn, done);
		});
	}
	// exposure driver to expose the module as
	if (typeof driver.expose === 'function') {
		logger.verbose('applying driver.expose to module [' + name + ']');
		var exposed = driver.expose();
		if (!exposed) {
			return new Error('invalid driver.expose given for module [' + name + '] (driver.expose must return the module object to be exposed)');
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

function validateDriverFuncArgs(name, driverFuncName, func, requiredArgNum) {
	var args = gn.lib.getArguments(func);
	var argsLen = args.length;
	if (argsLen !== requiredArgNum) {
		logger.error('module [' + name + '] driver.' + driverFuncName, ' expects', requiredArgNum, 'but', argsLen, 'given');
		return false;
	}
	return true;
}

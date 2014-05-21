var config;
var clients = {};
var mod;

// must be called
module.exports.set = function (module) {
	mod = module;
};

module.exports.config = function (configIn) {
	/*
	redis: {
		clients: {
			client1: { port: xx, host: yy, options: z},
			{...}
		}
	}
	*/
	if (!configIn.clients) {
		throw new Error('redis-driver: invalid configurations given:\n' + JSON.stringify(configIn, null, 4));
	}
	config = configIn;
};

module.exports.setup = function (cb) {
	for (var name in config.clients) {
		var conf = config.clients[name];
		clients[name] = mod.createClient(conf.port, conf.host, conf.options);
	}
	cb();
};

module.exports.shutdown = function (gracenode, cb) {
	var logger = gracenode.log.create('module-redis');
	for (var name in clients) {
		clients[name].quit();
		logger.info('gracefully terminated the connection [' + name + '] to:', config[name]);
	}
	cb();
};

module.exports.expose = function () {
	return clients;
};


var util = require('util');
var http = require('http');
var EventEmitter = require('events').EventEmitter;

var gracenode = require('../../../');
var log = gracenode.log.create('server-http');

var config = null;

module.exports.readConfig = function (configIn) {
	if (!configIn || !configIn.host || !configIn.port) {
		throw new Error('invalid configurations:\n' + JSON.stringify(configIn, null, 4));
	}
	config = configIn;
};

module.exports.start = function () {
	return new Http();	
};

function Http() {
	EventEmitter.call(this);
	var that = this;

	try {

		this.server = http.createServer(function (req, res) {
			that.handleRequest(req, res);
		});
		this.server.listen(config.port, config.host);

		// listener for gracenode shutdown
		gracenode.on('shutdown', function () {
			log.info('stopping server...');
			that.server.close();
			log.info('server stopped gracefully: ' + config.host + ':' + config.port);
		});

		log.info('server started:', config.host + ':' + config.port);

	} catch (exception) {
		gracenode.exit(exception);
	}
}

util.inherits(Http, EventEmitter);

Http.prototype.handleRequest = function (req, res) {

	log.info('request recieved:', req.url);
	
	this.emit('request', req, res);	
};



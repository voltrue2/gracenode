
var async = require('async');
var fs = require('fs');
var util = require('util');
var https = require('https');
var EventEmitter = require('events').EventEmitter;

var gracenode = require('../../../');
var log = gracenode.log.create('server-https');

var config = null;
var options = {};

module.exports.readConfig = function (configIn) {
	if (!configIn || !configIn.host || !configIn.port || !configIn.pemKey || !configIn.pemCert) {
		throw new Error('invalid configurations:\n' + JSON.stringify(configIn, null, 4));
	}
	config = configIn;
};

module.exports.setup = function (cb) {
	var list = [config.pemKey, config.pemCert];
	var index = 0;
	async.eachSeries(list, function (path, callback) {
		
		log.verbose('pem file loading:', path);

		fs.readFile(path, function (error, data) {
			if (error) {
				return cb(error);
			}
			if (index === 0) {
				options.key = data;
			} else {
				options.cert = data;
			}
	
			log.verbose('pem file loaded:', path);

			callback();
		});
	}, cb);
};

module.exports.start = function () {
	return new Https();	
};

function Https() {
	EventEmitter.call(this);
	var that = this;

	try {

		this.server = https.createServer(options, function (req, res) {
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

util.inherits(Https, EventEmitter);

Https.prototype.handleRequest = function (req, res) {
	log.info('request recieved:', req.url);
	this.emit('request', req, res);	
};



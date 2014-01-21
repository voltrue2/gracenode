
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

	log.verbose('setting up ssl server:', list);

	log.verbose('loading key pem file:', config.pemKey);
	fs.readFile(config.pemKey, 'utf8', function (error, keyData) {
		if (error) {
			return cb(error);
		}
		options.key = keyData;
		log.verbose('key pem file loaded:', options.key);
		log.verbose('loading cert pem file:', config.pemCert);
		fs.readFile(config.pemCert, 'utf8', function (error, certData) {
			if (error) {
				return cb(error);
			}
			options.cert = certData;
			log.verbose('cert pem fiile loaded:', options.cert);
			
			cb();
		});
	});
};

module.exports.start = function () {
	return new Https();	
};

function Https() {
	EventEmitter.call(this);
	var that = this;

	try {

		log.verbose('starting the server with:', options);

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



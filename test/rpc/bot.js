'use strict';

var gn = require('../../src/gracenode');
var req = require('request');
var Client = require('./simpleClient');
var domain = 'http://127.0.0.1:7979';
var command = 1;
var loop = 100;
var users = 10;
var logger;

gn.config({
	log: {
		color: true,
		console: true,
		level: 'info >='
	},
	cluster: {
		max: 4
	}
});
gn.start(function () {
	logger = gn.log.create('bot');
	for (var i = 0; i < users; i++) {
		var bot = new Bot();
		bot.start();
	}
});

function Bot() {
	this.sid = null;
	this.seq = 0;
	this.host = null;
	this.port = null;
	this.cipher = null;
}

Bot.prototype.start = function () {
	var that = this;
	var authed = function (error, res, body) {
		if (error) {
			return logger.error(error);
		}
		var data = JSON.parse(body);
		that.host = data.host;
		that.port = data.port;
		that.sid = data.sessionId;
		that.cipher = data.cipherData.base64;
		logger.info('authenticated:', that.host, that.port, that.sid, that.cipher);
		that.connect();
	};
	var params = {
		url: domain + '/auth'
	};
	req.post(params, authed);
};

Bot.prototype.connect = function () {
	var that = this;
	var client = new Client();
	client.start(this.host, this.port, function (error) {
		if (error) {
			return logger.error(error);
		}
		var infinite = 0;
		var count = 0;
		var msg = new Buffer(300);
		logger.info('start sending packet', loop, 'times: repeat', infinite);
		var send = function () {
			if (count < loop) {
				count += 1;
				that.seq += 1;
				logger.verbose('sending packet:', that.seq, command);
				client.sendSecure(that.sid, that.cipher, command, that.seq, msg, function () {
					setTimeout(send, 200);
				});
			} else {
				infinite += 1;
				logger.info('done -> repeat:', infinite);
				count = 0;
				send();
			}
		};
		send();
	});
};

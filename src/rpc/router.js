'use strict';

var gn = require('../gracenode');
var commands = {};
var logger;

module.exports.setup = function () {
	logger = gn.log.create('RPC.router');
};

module.exports.define = function (cmdId, cmdName, handler) {
	if (commands[cmdId]) {
		throw new Error('<RPC_COMMAND_ALREADY_DEFINED>:' + cmdId + '(' + cmdName + ')');
	}
	commands[cmdId] = {
		id: cmdId,
		name: cmdName,
		handler: handler
	};
};

module.exports.route = function (packet) {
	if (!commands[packet.command]) {
		logger.error('command handler not found for ', packet.command);
		return null;	
	}
	
	var cmd = commands[packet.command];
	
	logger.info('commnd routing resolved:', packet.command, cmd.name);

	return cmd;
};

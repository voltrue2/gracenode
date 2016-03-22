'use strict';

var async = require('async');
var gn = require('../gracenode');
var hooks = require('./hooks');
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
	if (commands[packet.command] === undefined) {
		logger.error('command handler not found for ', packet.command, packet);
		return null;	
	}
	
	var cmd = commands[packet.command];
	
	logger.info('command routing resolved:', packet.command, cmd.name);

	var hookList = hooks.findByCmdId(packet.command);

	logger.info('command hooks:', hookList);

	return {
		id: cmd.id,
		name: cmd.name,
		handler: cmd.handler,
		hooks: getHookExec(cmd.id, cmd.name, hookList)
	};
};

function getHookExec(cmdId, cmdName, hookList) {
	var exec = function (state, cb) {
		async.eachSeries(hookList, function (hook, next) {
			logger.info(
				'execute command hook (' + cmdId + ':' + cmdName + '):',
				(hook.name || 'anonymous')
			);
			hook(state, next);
		}, cb);
	};

	return exec;
}

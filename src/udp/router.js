'use strict';

var async = require('../../lib/async');
var gn = require('../gracenode');
var hooks = require('./hooks');
var commands = {};
var logger;

module.exports.setup = function () {
	logger = gn.log.create('UDP.router');
};

module.exports.define = function (cmdId, cmdName, handler) {
	if (commands[cmdId]) {
		if (cmdName !== commands[cmdId].name) {
			logger.error(
				'command name does not match for command ' + cmdId + ':',
				cmdName,
				commands[cmdId].cmdName,
				'"' + cmdName + '" is ignored'
			);
		}
		commands[cmdId].handlers.push(handler);
		return;
	}
	commands[cmdId] = {
		id: cmdId,
		name: cmdName,
		handlers: [ handler ]
	};
};

module.exports.getIdsByNames = function (names) {
	if (!Array.isArray(names)) {
		names = [names];
	}
	for (var id in commands) {
		var index = names.indexOf(commands[id].name);
		if (index !== -1) {
			// replace command name with its ID
			names[index] = id;
		}
	}
	return names;
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
		handlers: cmd.handlers,
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

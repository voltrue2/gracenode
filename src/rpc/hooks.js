'use strict';

// a map of hook functions that maps to command IDs
var hooks = {};
// a list of functions that hooks to all commands
var allHooks = [];

// cmdIdList can be the handler function and handler function can be undefined in that case
// if cmdIdList is not provided, the handler function is to be hooked to all command functions
module.exports.add = function (cmdIdList, handler) {
	if (typeof cmdIdList === 'function') {
		// hook to all command functions
		allHooks.push(cmdIdList);
		return;
	}
	if (typeof handler !== 'function') {
		throw new Error('RPCCommandHookHandlerMustBeFunction');
	}
	if (!Array.isArray(cmdIdList)) {
		cmdIdList = [cmdIdList];
	}
	for (var i = 0, len = cmdIdList.length; i < len; i++) {
		if (!hooks[cmdIdList[i]]) {
			hooks[cmdIdList[i]] = [];
		}
		hooks[cmdIdList].push(handler);
	}
};

module.exports.findByCmdId = function (cmdId) {
	var list = allHooks.concat([]);
	var matched = hooks[cmdId] || [];
	return list.concat(matched);	
};

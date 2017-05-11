'use strict';

/**
env module does two things:

1: if GRACENODE_CONF is given, it will load the value of it as configuration.

Example: export GRACENODE_CONF=/var/www/app/configs/prod.json

The above will make care to load a configuration file called /var/www/app/configs/prod.js (treated as full path)

2: it can replace placeholder variables in your configurations.

Example: export GRACENODE_RPC_HOST=my.awesome.game.domain.com

{
	rpc: {
		host: '{$RPC_HOST}'
	}
}

{
	rpc: {
		host: 'my.awesome.game.domain.com'
	}
}
*/

const env = {};
var prefix = 'GRACENODE';

module.exports.setPrefix = setPrefix;
module.exports.getEnv = getEnv;

/** @description Sets custom environment variable prefix
* @params {string} _prefix - Prefix
*/
function setPrefix(_prefix) {
	prefix = _prefix;
}

/** @description Returns all environment variables
*	w/ the prefix
* @returns {object}
*/
function getEnv() {
	for (const name in process.env) {
		if (name.indexOf(prefix) === 0) {
			env[name.replace(prefix + '_', '')] = process.env[name];
		}
	}
	return env;
}


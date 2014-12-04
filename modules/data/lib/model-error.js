'use strict';

var util = require('util');

module.exports = ModelError;

function ModelError(code, msg) {
	Error.call(this);
	this.code = code;
	this.message = msg;
}

util.inherits(ModelError, Error);

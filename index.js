'use strict';

var aeterno = require('aeterno');
var Gracenode = require('./core').Gracenode;
var gracenode = new Gracenode();

aeterno.setName('gracenode');

module.exports = gracenode;

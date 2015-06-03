'use strict';

var aeterno = require('aeterno');
var Gracenode = require('./core').Gracenode;
var gracenode = new Gracenode();

aeterno.setName('gracenode');

aeterno.setApplicationPath(module.parent.filename);

module.exports = gracenode;

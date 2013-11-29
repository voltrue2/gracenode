
var gracenode = require('../..');
var log = gracenode.log.create('pns-google');

var config = null;

module.exports.readConfig = function (configIn) {
    config = configIn;
};

module.exports.connect = function (mode, cb) {

    log.verbose('connecting to google...');

    cb();
};


var gn = require('gracenode');
var prefix = require('./prefix');

gn.setConfigPath(prefix + 'gracenode/test/configs/');
gn.setConfigFiles(['setup.json']);

gn.defineOption('-t', 'Expects 3 arguments.', false, function (arg1, arg2, arg3) {
	console.log('-t:', arg1, arg2, arg3);
});

gn.setup(function () {});

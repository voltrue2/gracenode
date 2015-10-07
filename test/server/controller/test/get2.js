var gn = require('../../../../gracenode');
var logger = gn.log.create('/test/get2');

module.exports.GET = function (req, res) {
	var parameters = req.parameters;
	var boo = req.data('boo');
	var foo = req.data('foo');

	logger.debug('request ID:', req.requestId);

	res.json({ boo: boo, foo: foo, parameters: parameters });
};

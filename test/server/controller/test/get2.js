var assert = require('assert');

module.exports.GET = function (req, res) {
	var parameters = req.parameters;
	var boo = req.data('boo');
	var foo = req.data('foo');
	assert(req.requestId);
	res.json({ boo: boo, foo: foo, parameters: parameters });
};

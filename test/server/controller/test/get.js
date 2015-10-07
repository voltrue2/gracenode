module.exports.GET = function (req, res) {
	var parameters = req.parameters;
	var boo = req.data('boo');
	var foo = req.data('foo');
	res.json({ boo: boo, foo: foo, parameters: parameters });
	res.json({ boo: boo, foo: foo, parameters: parameters });
};

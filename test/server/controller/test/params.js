module.exports.params = [
	'one',
	'two'
];

module.exports.GET = function (req, res) {
	var one = req.getParam ? req.getParam('one') : req.params.one;
	var two = req.getParam ? req.getParam('two') : req.params.two;
	res.json({ one: one, two: two });
};

module.exports.params = [
	'one',
	'two'
];

module.exports.GET = function (req, res) {
	var one = req.getParam('one');
	var two = req.getParam('two');
	res.json({ one: one, two: two });
};

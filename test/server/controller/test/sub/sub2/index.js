exports.params = [
	'one',
	'two'
];

exports.GET = function (req, res) {
	res.json({ key: req.get('key'), method: 'sub2/index', params: req.parameters });
};

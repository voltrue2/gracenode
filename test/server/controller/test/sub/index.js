exports.GET = function (req, res) {
	res.json({ key: req.get('key'), method: 'index', params: req.parameters });
};

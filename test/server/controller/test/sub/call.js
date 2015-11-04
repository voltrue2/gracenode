exports.GET = function (req, res) {
	res.json({ method: 'call', params: req.parameters });
};

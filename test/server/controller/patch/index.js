exports.PATCH = function (req, res) {
	var data = req.data('data');
	res.json({ data: data });
};

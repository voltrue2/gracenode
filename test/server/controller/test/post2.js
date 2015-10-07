module.exports.POST = function (req, res) {
	var list = req.data('list', req.data('literal'));
	res.json(list);
};

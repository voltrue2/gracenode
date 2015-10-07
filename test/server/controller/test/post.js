module.exports.POST = function (req, res) {
	var boo = req.data('boo');
	res.json(boo);
};

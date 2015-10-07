module.exports.DELETE = function (req, res) {
	var boo = req.data('boo');
	res.json(boo);
};

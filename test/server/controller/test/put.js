module.exports.PUT = function (req, res) {
	var boo = req.data('boo');
	res.json(boo);
};

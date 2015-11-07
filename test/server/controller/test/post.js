module.exports.POST = function (req, res) {
	var boo = req.data ? req.data('boo') : req.body.boo;
	res.json(boo);
};

exports.GET = function (req, res) {
	res.header('url', req.url);
	res.json('here');
};
